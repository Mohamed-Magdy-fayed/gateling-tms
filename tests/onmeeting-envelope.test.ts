import { describe, expect, test } from "vitest";
import {
  buildJoinUrl,
  hasProviderError,
  ONMEETING_API_BASE_URL,
  OnMeetingApiError,
  unwrapEnvelope,
} from "../src/integrations/onmeeting/envelope";

describe("unwrapEnvelope", () => {
  test("returns the payload nested under results.data", () => {
    const data = unwrapEnvelope(
      { results: { data: { api_key: "k", api_secret: "s" } } },
      200,
    );

    expect(data).toEqual({ api_key: "k", api_secret: "s" });
  });

  test("accepts an array payload — /user/rooms answers with one", () => {
    const data = unwrapEnvelope(
      { results: { data: [{ room_code: "R1" }] } },
      200,
    );

    expect(data).toEqual([{ room_code: "R1" }]);
  });

  test("throws on a non-2xx status before looking at the body", () => {
    expect(() => unwrapEnvelope({ results: { data: {} } }, 401)).toThrow(
      OnMeetingApiError,
    );
  });

  test("throws when the envelope is missing entirely", () => {
    expect(() => unwrapEnvelope({ api_key: "k" }, 200)).toThrow(
      OnMeetingApiError,
    );
  });

  test("throws on a null body rather than returning undefined", () => {
    expect(() => unwrapEnvelope(null, 200)).toThrow(OnMeetingApiError);
  });

  test("carries the status through so callers can tell refusal from outage", () => {
    expect.assertions(2);
    try {
      unwrapEnvelope(null, 503);
    } catch (error) {
      expect(error).toBeInstanceOf(OnMeetingApiError);
      expect((error as OnMeetingApiError).status).toBe(503);
    }
  });

  // The connect flow submits the admin's own password. onMeeting's error text
  // is written by a third party and can echo submitted input, so it must never
  // become the message this app throws (STATE.md D146).
  test("never reuses the provider's error text as the thrown message", () => {
    expect.assertions(2);
    try {
      unwrapEnvelope(
        { errorMessage: "Invalid password: hunter2 for user a@b.com" },
        401,
      );
    } catch (error) {
      const message = (error as OnMeetingApiError).message;
      expect(message).not.toContain("hunter2");
      expect(message).not.toContain("a@b.com");
    }
  });
});

describe("hasProviderError", () => {
  test("recognizes onMeeting's own error shape", () => {
    expect(hasProviderError({ errorMessage: "Nope" })).toBe(true);
  });

  test("rejects anything else answering on that URL", () => {
    expect(hasProviderError("<html>502 Bad Gateway</html>")).toBe(false);
    expect(hasProviderError({ error: "Nope" })).toBe(false);
    expect(hasProviderError(null)).toBe(false);
  });

  test("rejects an empty error message — that carries no signal", () => {
    expect(hasProviderError({ errorMessage: "" })).toBe(false);
  });
});

describe("buildJoinUrl", () => {
  test("builds the public participant link for a meeting number", () => {
    expect(buildJoinUrl("123456789")).toBe("https://onmeeting.co/j/123456789");
  });

  test("encodes the segment so a hostile meeting number can't escape the path", () => {
    expect(buildJoinUrl("1/../../admin")).toBe(
      "https://onmeeting.co/j/1%2F..%2F..%2Fadmin",
    );
  });
});

describe("base url", () => {
  test("is the versioned API root the legacy client used", () => {
    expect(ONMEETING_API_BASE_URL).toBe("https://onmeeting.co/v2");
  });
});
