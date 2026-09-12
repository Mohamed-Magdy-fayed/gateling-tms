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
 * Meetings are created on demand (STATE.md D143), so "start" is a real action
 * a human takes rather than a job that ran days ago — and starting flips the
 * session to `ongoing`. A generous window either side keeps a teacher who is
 * early or running late from being locked out, while stopping a class three
 * weeks away from being marked as in progress today.
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
