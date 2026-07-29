export const ZOOM_CLIENTS_PATH = "/live-classes/zoom-clients";

/**
 * The only values the connect/callback routes may put in the URL. Raw Zoom or
 * database error text never travels through a query parameter — it would leak
 * internals and let a crafted link render attacker-chosen text in a styled
 * alert (STATE.md D47). Details are logged server-side and stored on the row's
 * `lastError` for the org's own admins.
 */
export const zoomConnectResultCodes = [
  "connected",
  "denied",
  "invalid_state",
  "connect_failed",
  "not_configured",
  "forbidden",
] as const;

export type ZoomConnectResultCode = (typeof zoomConnectResultCodes)[number];

export const ZOOM_CONNECT_RESULT_PARAM = "zoomResult";

export function buildZoomClientsUrl(code: ZoomConnectResultCode): string {
  return `${ZOOM_CLIENTS_PATH}?${ZOOM_CONNECT_RESULT_PARAM}=${code}`;
}

export function parseZoomConnectResultCode(
  value: string | null | undefined,
): ZoomConnectResultCode | null {
  const codes: readonly string[] = zoomConnectResultCodes;
  return value && codes.includes(value)
    ? (value as ZoomConnectResultCode)
    : null;
}
