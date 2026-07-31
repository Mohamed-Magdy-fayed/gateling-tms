import { afterEach, describe, expect, test, vi } from "vitest";
import {
  createMeeting,
  listRooms,
  requestAccessToken,
  requestApiKeys,
} from "../src/integrations/onmeeting/api";
import { OnMeetingApiError } from "../src/integrations/onmeeting/envelope";

type Call = { url: string; init: RequestInit | undefined };

/**
 * onMeeting has no sandbox, so the client is exercised against the response
 * shapes the legacy app observed in production
 * (`SOURCE/src/lib/zoom/onmeeting.ts`).
 */
function stubFetch(responses: Array<{ status?: number; body: unknown }>) {
  const calls: Call[] = [];
  let index = 0;

  vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const next = responses[index++] ?? responses[responses.length - 1];
    return Promise.resolve({
      ok: (next.status ?? 200) >= 200 && (next.status ?? 200) < 300,
      status: next.status ?? 200,
      json: () => Promise.resolve(next.body),
    } as Response);
  });

  return calls;
}

function envelope(data: unknown) {
  return { results: { data } };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("requestApiKeys", () => {
  test("exchanges an email and password for the account's keys", async () => {
    const calls = stubFetch([
      {
        body: envelope({
          api_key: "key-1",
          api_secret: "secret-1",
          account_id: "acc-1",
        }),
      },
    ]);

    const keys = await requestApiKeys("teacher@example.com", "hunter2");

    expect(keys).toEqual({
      apiKey: "key-1",
      apiSecret: "secret-1",
      accountId: "acc-1",
    });
    expect(calls[0].url).toBe("https://onmeeting.co/v2/user/api-keys");
    expect(calls[0].init?.method).toBe("POST");
  });

  test("sends the credentials in the body, never in the URL", async () => {
    const calls = stubFetch([
      { body: envelope({ api_key: "k", api_secret: "s", account_id: "a" }) },
    ]);

    await requestApiKeys("teacher@example.com", "hunter2");

    // A credential in a query string ends up in access logs and proxy history.
    expect(calls[0].url).not.toContain("hunter2");
    expect(calls[0].url).not.toContain("teacher@example.com");
  });

  test("a rejected sign-in throws without echoing the submitted password", async () => {
    stubFetch([
      {
        status: 401,
        body: { errorMessage: "Wrong password 'hunter2' for teacher@x.com" },
      },
    ]);

    await expect(
      requestApiKeys("teacher@example.com", "hunter2"),
    ).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof OnMeetingApiError &&
        error.status === 401 &&
        !error.message.includes("hunter2"),
    );
  });

  test("a response missing a key is refused rather than stored half-empty", async () => {
    stubFetch([{ body: envelope({ api_key: "k", account_id: "a" }) }]);

    await expect(requestApiKeys("a@b.com", "pw")).rejects.toBeInstanceOf(
      OnMeetingApiError,
    );
  });
});

describe("requestAccessToken", () => {
  test("trades keys for a bearer token", async () => {
    stubFetch([{ body: envelope({ token: "bearer-1" }) }]);

    await expect(
      requestAccessToken({ apiKey: "k", apiSecret: "s" }),
    ).resolves.toBe("bearer-1");
  });
});

describe("listRooms", () => {
  test("maps every room to its code and name", async () => {
    stubFetch([
      {
        body: envelope([
          { room_code: "R1", room_name: "Main hall", room_capicity: 100 },
          { room_code: "R2", room_name: "Studio" },
        ]),
      },
    ]);

    await expect(listRooms("bearer-1")).resolves.toEqual([
      { roomCode: "R1", roomName: "Main hall" },
      { roomCode: "R2", roomName: "Studio" },
    ]);
  });

  test("an account with no rooms resolves empty rather than throwing", async () => {
    stubFetch([{ body: envelope([]) }]);

    await expect(listRooms("bearer-1")).resolves.toEqual([]);
  });

  test("sends the token as a bearer header", async () => {
    const calls = stubFetch([{ body: envelope([]) }]);

    await listRooms("bearer-1");

    const headers = calls[0].init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer bearer-1");
  });
});

describe("createMeeting", () => {
  const request = {
    topic: "Level 1 — Monday",
    roomCode: "R1",
    joinBeforeHost: true,
    recording: false,
    alert: false,
  };

  test("creates the meeting, then resolves its links", async () => {
    const calls = stubFetch([
      { body: envelope({ meeting_no: "987654321" }) },
      {
        body: envelope({
          join_url: "https://onmeeting.co/j/987654321",
          start_url: "https://onmeeting.co/s/987654321?zak=tok",
        }),
      },
    ]);

    await expect(createMeeting("bearer-1", request)).resolves.toEqual({
      meetingNumber: "987654321",
      joinUrl: "https://onmeeting.co/j/987654321",
      startUrl: "https://onmeeting.co/s/987654321?zak=tok",
    });

    expect(calls[0].url).toBe("https://onmeeting.co/v2/meeting");
    expect(calls[1].url).toBe("https://onmeeting.co/v2/meeting/987654321");
  });

  test("sends onMeeting's own field names, not this app's", async () => {
    const calls = stubFetch([
      { body: envelope({ meeting_no: "1" }) },
      { body: envelope({ join_url: "https://j", start_url: "https://s" }) },
    ]);

    await createMeeting("bearer-1", request);

    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      topic: "Level 1 — Monday",
      room_code: "R1",
      join_before_host: true,
      recording: false,
      alert: false,
    });
  });

  // The room is busy — the legacy client surfaced this as "Another meeting may
  // be ongoing now on this zoom room!". Whatever the wording, it must not
  // become a half-created meeting the teacher can't start.
  test("a busy room fails outright rather than yielding a linkless meeting", async () => {
    stubFetch([{ status: 400, body: { errorMessage: "Room busy" } }]);

    await expect(createMeeting("bearer-1", request)).rejects.toBeInstanceOf(
      OnMeetingApiError,
    );
  });

  test("a details response with no start_url throws — a host link can't be guessed", async () => {
    stubFetch([
      { body: envelope({ meeting_no: "1" }) },
      { body: envelope({ join_url: "https://onmeeting.co/j/1" }) },
    ]);

    await expect(createMeeting("bearer-1", request)).rejects.toBeInstanceOf(
      OnMeetingApiError,
    );
  });
});

describe("non-onMeeting responses", () => {
  test("an HTML error page is reported as unreachable, not parsed", async () => {
    stubFetch([{ status: 502, body: "<html>Bad Gateway</html>" }]);

    await expect(
      requestAccessToken({ apiKey: "k", apiSecret: "s" }),
    ).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof OnMeetingApiError &&
        error.message === "onMeeting is unreachable.",
    );
  });
});
