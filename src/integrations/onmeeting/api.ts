import "server-only";

import { z } from "zod";

import {
  buildJoinUrl,
  hasProviderError,
  ONMEETING_API_BASE_URL,
  OnMeetingApiError,
  unwrapEnvelope,
} from "./envelope";

const ONMEETING_FETCH_TIMEOUT_MS = 10_000;

/**
 * onMeeting's HTTP API.
 *
 * There is no published documentation for it — every endpoint here is taken
 * from the legacy app's working client (`SOURCE/src/lib/zoom/onmeeting.ts`),
 * which ran against this API in production. The two deliberate departures from
 * that client: responses are **Zod-parsed** rather than cast with `as T`, and
 * provider error text is never propagated to the caller (see `envelope.ts`).
 *
 * See `docs/integrations-onmeeting.md` for the endpoint table and the
 * questions still open with onMeeting's support team.
 */

const apiKeysSchema = z.object({
  api_key: z.string().min(1),
  api_secret: z.string().min(1),
  account_id: z.string().min(1),
});

const tokenSchema = z.object({
  token: z.string().min(1),
});

/**
 * `room_capicity` is onMeeting's spelling, not a typo on this side. Everything
 * except the code and name is optional: the app only needs to know which rooms
 * exist and what to call them, and a field this app doesn't use must not be
 * able to fail a connect.
 */
const roomSchema = z.object({
  room_code: z.string().min(1),
  room_name: z.string().min(1),
  account_id: z.string().min(1).optional(),
  room_capicity: z.number().int().optional(),
  active: z.number().int().optional(),
  status: z.number().int().optional(),
});

const roomsSchema = z.array(roomSchema);

const createdMeetingSchema = z.object({
  meeting_no: z.string().min(1),
  topic: z.string().optional(),
  room_code: z.string().optional(),
});

const meetingDetailsSchema = z.object({
  join_url: z.string().min(1),
  start_url: z.string().min(1),
});

export type OnMeetingApiKeys = {
  apiKey: string;
  apiSecret: string;
  accountId: string;
};

export type OnMeetingRoom = {
  roomCode: string;
  roomName: string;
};

export type OnMeetingMeeting = {
  meetingNumber: string;
  joinUrl: string;
  startUrl: string;
};

export type OnMeetingMeetingRequest = {
  topic: string;
  roomCode: string;
  joinBeforeHost: boolean;
  recording: boolean;
  alert: boolean;
};

/**
 * Exchanges an onMeeting sign-in for long-lived API keys.
 *
 * **The password reaches exactly this function and goes no further.** It is
 * never persisted, never logged, and never included in a thrown message — the
 * caller stores only what comes back.
 */
export async function requestApiKeys(
  email: string,
  password: string,
): Promise<OnMeetingApiKeys> {
  const data = await postJson("/user/api-keys", { email, password });
  const keys = parseOrThrow(apiKeysSchema, data);

  return {
    apiKey: keys.api_key,
    apiSecret: keys.api_secret,
    accountId: keys.account_id,
  };
}

/**
 * Trades API keys for a bearer token. Short-lived and never persisted — its
 * TTL is undocumented (`docs/integrations-onmeeting.md` §7), so assuming one
 * and caching against it would be guessing.
 */
export async function requestAccessToken(
  keys: Pick<OnMeetingApiKeys, "apiKey" | "apiSecret">,
): Promise<string> {
  const data = await postJson("/auth/token", {
    api_key: keys.apiKey,
    api_secret: keys.apiSecret,
  });

  return parseOrThrow(tokenSchema, data).token;
}

export async function listRooms(token: string): Promise<OnMeetingRoom[]> {
  const data = await getJson("/user/rooms", token);

  return parseOrThrow(roomsSchema, data).map((room) => ({
    roomCode: room.room_code,
    roomName: room.room_name,
  }));
}

/**
 * Creates a meeting in a room and resolves its links.
 *
 * Two calls, because create answers with a meeting number but no URLs. If the
 * details call fails, the participant link is still derivable from the number
 * — but the host link is not, so that case throws rather than returning a
 * meeting the teacher can't start.
 */
export async function createMeeting(
  token: string,
  request: OnMeetingMeetingRequest,
): Promise<OnMeetingMeeting> {
  const created = parseOrThrow(
    createdMeetingSchema,
    await postJson(
      "/meeting",
      {
        topic: request.topic,
        room_code: request.roomCode,
        join_before_host: request.joinBeforeHost,
        recording: request.recording,
        alert: request.alert,
      },
      token,
    ),
  );

  const details = parseOrThrow(
    meetingDetailsSchema,
    await getJson(`/meeting/${encodeURIComponent(created.meeting_no)}`, token),
  );

  return {
    meetingNumber: created.meeting_no,
    joinUrl: details.join_url || buildJoinUrl(created.meeting_no),
    startUrl: details.start_url,
  };
}

function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new OnMeetingApiError("Unexpected onMeeting response.", 200);
  }
  return parsed.data;
}

async function postJson(
  path: string,
  body: Record<string, unknown>,
  token?: string,
): Promise<unknown> {
  return request(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(body),
  });
}

async function getJson(path: string, token: string): Promise<unknown> {
  return request(path, { headers: authHeader(token) });
}

async function request(path: string, init: RequestInit): Promise<unknown> {
  const response = await fetchWithTimeout(
    `${ONMEETING_API_BASE_URL}${path}`,
    init,
  );
  const payload = await readJson(response);

  if (!response.ok && !hasProviderError(payload)) {
    // Not onMeeting answering — a proxy, a captive portal, an outage page.
    // Worth distinguishing in the thrown status, not in the message.
    throw new OnMeetingApiError("onMeeting is unreachable.", response.status);
  }

  return unwrapEnvelope(payload, response.status);
}

function authHeader(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// An unresponsive onMeeting would otherwise hang the request that is waiting
// on it — and one of those is a teacher starting a class, so the bound matters.
function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    ONMEETING_FETCH_TIMEOUT_MS,
  );

  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timeout),
  );
}
