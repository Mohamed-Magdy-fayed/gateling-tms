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

export function sessionStatusAt(
  session: PlannedSession,
  now: Date,
): SessionStatus {
  if (session.cancelled) return "cancelled";
  return before(session.endsAt, now) ? "completed" : "scheduled";
}

export function groupStatusAt(cohort: Cohort, now: Date): GroupStatus {
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

export function enrollmentStatusAt(
  cohort: Cohort,
  seat: Seat,
  now: Date,
): EnrollmentStatus {
  if (!isOnRoster(seat, now)) return "placementTest";
  if (!before(cohort.sessions[0].scheduledAt, now)) return "waiting";
  if (seat.drop && hasDroppedBy(cohort, seat, now)) return seat.drop.kind;
  return before(cohort.endsAt, now) ? "completed" : "ongoing";
}

export function enrollmentLevelAt(
  cohort: Cohort,
  seat: Seat,
  levelIndex: number,
  now: Date,
): { status: EnrollmentLevelStatus; completedAt: Date | null } {
  const level = cohort.levels[levelIndex];
  const dropAt = seat.drop?.atSession ?? Number.POSITIVE_INFINITY;
  if (dropAt <= level.firstIndex)
    return { status: "notStarted", completedAt: null };
  if (dropAt > level.lastIndex && before(level.lastEnd, now)) {
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
