/** When a session that starts at `scheduledAt` is over. */
export function sessionEndsAt(
  scheduledAt: Date,
  durationMinutes: number,
): Date {
  return new Date(scheduledAt.getTime() + durationMinutes * 60_000);
}

/**
 * Picks the Zoom account that hosts a session, given the org's connected
 * accounts and the ones already hosting something in the same window.
 *
 * A Zoom user can only host one meeting at a time, so an org with two
 * licences running two parallel classes needs them on different accounts —
 * SOURCE solved the same problem with `getAvailableZoomClient`. Candidates
 * are passed in the order the caller wants them tried (oldest connection
 * first), so the choice stays stable rather than moving between runs.
 *
 * Returns null when every connected account is busy: the session then stays
 * offline instead of silently double-booking an account, and the sessions
 * page shows it as such.
 */
export function selectAvailableZoomClient(
  candidateIds: readonly string[],
  busyClientIds: Iterable<string>,
): string | null {
  const busy = new Set(busyClientIds);
  return candidateIds.find((id) => !busy.has(id)) ?? null;
}
