import { z } from "zod";

/**
 * onMeeting's response shape, and the pure helpers built on it.
 *
 * Deliberately free of `server-only` and of `fetch`: the envelope is the part
 * most likely to drift on onMeeting's side (they publish no documentation and
 * no versioning promise beyond the `/v2` path), so it is the part that most
 * needs unit tests. Everything that actually talks to the network lives in
 * `api.ts`.
 */

export const ONMEETING_BASE_URL = "https://onmeeting.co";
export const ONMEETING_API_BASE_URL = `${ONMEETING_BASE_URL}/v2`;

export class OnMeetingApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/**
 * Success payloads arrive as `{ results: { data: ... } }`. `data` is whatever
 * the endpoint returns, so it stays `unknown` here and each caller parses it
 * with its own schema — a shape that matched the envelope but not the endpoint
 * would otherwise reach business logic unchecked.
 */
const envelopeSchema = z.object({
  results: z.object({ data: z.unknown() }),
});

const errorSchema = z.object({
  errorMessage: z.string().min(1),
});

/**
 * Pulls `results.data` out of a parsed JSON body, or throws.
 *
 * `status` is carried through so the caller can distinguish "onMeeting refused
 * these credentials" from "onMeeting is down", but the provider's own error
 * text is **not** used as the thrown message — it is attacker-influenced in the
 * connect flow (an error can echo submitted input) and is never shown to a
 * user or written to a log. Callers translate a status into their own copy.
 */
export function unwrapEnvelope(payload: unknown, status: number): unknown {
  if (status < 200 || status >= 300) {
    throw new OnMeetingApiError(describeStatus(status), status);
  }

  const envelope = envelopeSchema.safeParse(payload);
  if (!envelope.success) {
    throw new OnMeetingApiError("Unexpected onMeeting response.", status);
  }

  return envelope.data.results.data;
}

/**
 * Whether a failed body carried onMeeting's own error field. Only used to tell
 * "a real onMeeting error" apart from "something else answered on that URL"
 * (a captive portal, a proxy error page) — the text itself is not propagated.
 */
export function hasProviderError(payload: unknown): boolean {
  return errorSchema.safeParse(payload).success;
}

function describeStatus(status: number): string {
  if (status === 401 || status === 403) {
    return "onMeeting rejected these credentials.";
  }
  if (status === 404) {
    return "onMeeting could not find that resource.";
  }
  if (status === 429) {
    return "onMeeting is rate limiting this account.";
  }
  return "onMeeting request failed.";
}

/**
 * The participant link for a meeting number.
 *
 * onMeeting's `GET /meeting/{no}` returns a `join_url` and that is what gets
 * stored; this builder is the fallback for the create response, which carries
 * a `meeting_no` but no URLs. Both point at the same place — the legacy client
 * constructed this exact form for its meeting list.
 */
export function buildJoinUrl(meetingNumber: string): string {
  return `${ONMEETING_BASE_URL}/j/${encodeURIComponent(meetingNumber)}`;
}
