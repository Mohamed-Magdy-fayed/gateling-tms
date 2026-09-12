export const SESSIONS_PATH = "/live-classes/sessions";

/**
 * Why a join couldn't be honoured, as the only values the join route may put
 * in the URL it redirects back to. Raw provider or database error text never
 * travels through a query parameter — it would leak internals and let a
 * crafted link render attacker-chosen text in a styled alert (STATE.md D47).
 *
 * Each value doubles as the `sessions.errors.*` key that explains it, so the
 * server-side error, the redirect and the alert all name one thing.
 */
export const sessionJoinResultCodes = [
  "notStarted",
  "cancelled",
  "notConfigured",
  "misconfigured",
  "meetingOver",
  "busy",
  "unavailable",
  "notFound",
] as const;

export type SessionJoinResultCode = (typeof sessionJoinResultCodes)[number];

export const SESSION_JOIN_RESULT_PARAM = "joinResult";

export function buildSessionsUrl(code: SessionJoinResultCode): string {
  return `${SESSIONS_PATH}?${SESSION_JOIN_RESULT_PARAM}=${code}`;
}

export function parseSessionJoinResultCode(
  value: string | null | undefined,
): SessionJoinResultCode | null {
  const codes: readonly string[] = sessionJoinResultCodes;
  return value && codes.includes(value)
    ? (value as SessionJoinResultCode)
    : null;
}
