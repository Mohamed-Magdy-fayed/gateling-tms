import type {
  EnrollmentLevelStatus,
  EnrollmentStatus,
  GroupStatus,
  SessionStatus,
} from "@/drizzle/schema";
import type { Cohort, PlannedSession, Seat } from "./cohorts";

/**
 * Where each row sits in its lifecycle at `now`. Pure functions of the fixed
 * history and the clock — the only reason a showcase row's state ever differs
 * between two runs.
 */

const before = (a: Date, b: Date) => a.getTime() <= b.getTime();

/** Has the group stopped (paused or cancelled) by `now`? */
export function isHaltedBy(cohort: Cohort, now: Date): boolean {
  return !!cohort.halt && before(cohort.halt.at, now);
}

export function sessionStatusAt(
  cohort: Cohort,
  session: PlannedSession,
  now: Date,
): SessionStatus {
  if (session.cancelled) return "cancelled";
  // Stopping a group calls off the classes it hadn't held yet.
  if (
    cohort.halt &&
    session.index >= cohort.halt.atSession &&
    isHaltedBy(cohort, now)
  ) {
    return "cancelled";
  }
  return before(session.endsAt, now) ? "completed" : "scheduled";
}

/** Was this class actually held by `now` (so it has attendance)? */
export function wasHeld(
  cohort: Cohort,
  session: PlannedSession,
  now: Date,
): boolean {
  return sessionStatusAt(cohort, session, now) === "completed";
}

export function groupStatusAt(cohort: Cohort, now: Date): GroupStatus {
  if (cohort.halt && isHaltedBy(cohort, now)) return cohort.halt.kind;
  return before(cohort.endsAt, now) ? "completed" : "active";
}

/** Has this seat left the cohort by `now`? */
export function hasDroppedBy(cohort: Cohort, seat: Seat, now: Date): boolean {
  if (!seat.drop) return false;
  return before(cohort.sessions[seat.drop.atSession].scheduledAt, now);
}

/** Placement is done, so the trainee is on the group's roster. */
export function isOnRoster(seat: Seat, now: Date): boolean {
  return before(seat.placementDoneAt ?? seat.enrolledAt, now);
}

/** When this seat stops paying: when the student left, or the group stopped. */
export function seatStopsAt(cohort: Cohort, seat: Seat): Date | null {
  if (seat.drop) return cohort.sessions[seat.drop.atSession].scheduledAt;
  return cohort.halt?.at ?? null;
}

export function enrollmentStatusAt(
  cohort: Cohort,
  seat: Seat,
  now: Date,
): EnrollmentStatus {
  if (!isOnRoster(seat, now)) return "placementTest";
  if (!before(cohort.sessions[0].scheduledAt, now)) return "waiting";
  if (seat.drop && hasDroppedBy(cohort, seat, now)) return seat.drop.kind;
  // A paused group's students are postponed; a cancelled one's, cancelled.
  if (cohort.halt && isHaltedBy(cohort, now)) {
    return cohort.halt.kind === "paused" ? "postponed" : "cancelled";
  }
  return before(cohort.endsAt, now) ? "completed" : "ongoing";
}

export function enrollmentLevelAt(
  cohort: Cohort,
  seat: Seat,
  levelIndex: number,
  now: Date,
): { status: EnrollmentLevelStatus; completedAt: Date | null } {
  const level = cohort.levels[levelIndex];
  // The first class this seat never gets to: they left, or the group stopped.
  const stopAt = Math.min(
    seat.drop?.atSession ?? Number.POSITIVE_INFINITY,
    cohort.halt?.atSession ?? Number.POSITIVE_INFINITY,
  );
  if (stopAt <= level.firstIndex)
    return { status: "notStarted", completedAt: null };
  if (stopAt > level.lastIndex && before(level.lastEnd, now)) {
    return { status: "completed", completedAt: level.lastEnd };
  }
  if (before(level.firstStart, now))
    return { status: "inProgress", completedAt: null };
  return { status: "notStarted", completedAt: null };
}

/** Was this seat expected in this class (enrolled, not yet dropped)? */
export function expectedAt(seat: Seat, session: PlannedSession): boolean {
  return !seat.drop || session.index < seat.drop.atSession;
}
