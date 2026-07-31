/** When a session that starts at `scheduledAt` is over. */
export function sessionEndsAt(
  scheduledAt: Date,
  durationMinutes: number,
): Date {
  return new Date(scheduledAt.getTime() + durationMinutes * 60_000);
}

/** How long before the scheduled time a host may open the room. */
export const MEETING_EARLY_START_MINUTES = 15;
/** How long after a class was due to end starting it is still reasonable. */
export const MEETING_LATE_START_MINUTES = 30;

/**
 * Whether a class can be started right now.
 *
 * onMeeting meetings are created on demand (STATE.md D143), so "start" is a
 * real action a human takes rather than a job that ran days ago — and it
 * occupies a room while it runs. A generous window either side keeps a teacher
 * who is early or running late from being locked out, while stopping a class
 * three weeks away from claiming a room today.
 */
export function isWithinMeetingWindow(
  scheduledAt: Date,
  durationMinutes: number,
  now: Date,
): boolean {
  const opensAt = new Date(
    scheduledAt.getTime() - MEETING_EARLY_START_MINUTES * 60_000,
  );
  const closesAt = new Date(
    sessionEndsAt(scheduledAt, durationMinutes).getTime() +
      MEETING_LATE_START_MINUTES * 60_000,
  );

  return now >= opensAt && now <= closesAt;
}

/**
 * Picks the room that hosts a session, given the org's connected rooms and the
 * ones already busy in the same window.
 *
 * A room can only host one live meeting at a time, so an org running two
 * parallel classes needs two rooms — the legacy client surfaced the failure as
 * "Another meeting may be ongoing now on this zoom room!". Candidates are
 * passed in the order the caller wants them tried (oldest connection first),
 * so the choice stays stable rather than moving between runs.
 *
 * Returns null when every connected room is busy: the session then stays
 * offline instead of silently double-booking a room, and the page says so.
 */
export function selectAvailableMeetingAccount(
  candidateIds: readonly string[],
  busyAccountIds: Iterable<string>,
): string | null {
  const busy = new Set(busyAccountIds);
  return candidateIds.find((id) => !busy.has(id)) ?? null;
}
