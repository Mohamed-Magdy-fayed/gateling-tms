export const GOOGLE_IMPORT_PATH = "/assessments/google";

/**
 * The only values the connect/callback routes may put in the URL. Raw Google
 * or database error text never travels through a query parameter — it would
 * leak internals and let a crafted link render attacker-chosen text in a
 * styled alert (STATE.md D47). Details are logged server-side and stored on
 * the row's `lastError` for the org's own admins.
 */
export const googleConnectResultCodes = [
  "connected",
  "denied",
  "invalid_state",
  "connect_failed",
  "not_configured",
  "forbidden",
  // Google issues a refresh token only on a fresh consent. Without one the
  // grant would stop working an hour later with no way to renew it, so the
  // connection is refused and the admin is told to remove the app's existing
  // access and try again.
  "no_refresh_token",
  // The consent screen let the account through without the Forms scope
  // (Google lets a user deselect individual permissions).
  "missing_scope",
] as const;

export type GoogleConnectResultCode = (typeof googleConnectResultCodes)[number];

export const GOOGLE_CONNECT_RESULT_PARAM = "googleResult";

export function buildGoogleImportUrl(code: GoogleConnectResultCode): string {
  return `${GOOGLE_IMPORT_PATH}?${GOOGLE_CONNECT_RESULT_PARAM}=${code}`;
}

export function parseGoogleConnectResultCode(
  value: string | null | undefined,
): GoogleConnectResultCode | null {
  const codes: readonly string[] = googleConnectResultCodes;
  return value && codes.includes(value)
    ? (value as GoogleConnectResultCode)
    : null;
}
