/**
 * Refresh this long before the stated expiry. A token that expires mid-flight
 * would fail the very API call it was fetched for, and both providers' access
 * tokens live an hour, so a minute of slack costs nothing.
 */
export const ACCESS_TOKEN_EXPIRY_SKEW_MS = 60_000;

/** Pure so the refresh boundary is testable without a database or a live API. */
export function needsRefresh(
  expiresAt: Date | null | undefined,
  now: Date,
): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() - ACCESS_TOKEN_EXPIRY_SKEW_MS <= now.getTime();
}
