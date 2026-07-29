import type {
  EnrollmentLevelStatus,
  EnrollmentStatus,
  SessionStatus,
} from "@/drizzle/schema";

/**
 * Progress arithmetic, kept pure and free of any database access so it can be
 * unit-tested on its own — the same shape as `groups/server/schedule.ts` and
 * `assessments/responses/server/scoring.ts`.
 *
 * Every function here takes already-fetched rows; the queries in `queries.ts`
 * are the only thing that talks to Postgres.
 */

export type LevelProgressRow = {
  /** `null` when the trainee has never touched the level (LEFT JOIN miss). */
  status: EnrollmentLevelStatus | null;
};

export type LevelProgressSummary = {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  /** 0–100, rounded. 0 when the course has no levels at all. */
  percentComplete: number;
};

/**
 * A level with no `enrollment_levels` row counts as `notStarted` rather than
 * being skipped: the course's own level list is the denominator (the same
 * decision `listEnrollmentLevels` makes), so adding a level to a course
 * correctly drops every existing trainee's percentage instead of leaving it
 * silently overstated.
 */
export function summarizeLevels(
  levels: readonly LevelProgressRow[],
): LevelProgressSummary {
  let completed = 0;
  let inProgress = 0;

  for (const level of levels) {
    if (level.status === "completed") completed += 1;
    else if (level.status === "inProgress") inProgress += 1;
  }

  const total = levels.length;

  return {
    total,
    completed,
    inProgress,
    notStarted: total - completed - inProgress,
    // Guarded rather than allowed to produce NaN: a course with no levels yet
    // is normal (instant onboarding), and NaN would render as "NaN%".
    percentComplete: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export type EnrollmentStatusRow = { status: EnrollmentStatus };

export type EnrollmentStatusSummary = {
  total: number;
  byStatus: Record<EnrollmentStatus, number>;
};

/**
 * Counts are keyed by every status in the enum, not only the ones present, so
 * the UI can render a fixed set of tiles without null-checking each one.
 */
export function summarizeEnrollmentStatuses(
  enrollments: readonly EnrollmentStatusRow[],
): EnrollmentStatusSummary {
  const byStatus: Record<EnrollmentStatus, number> = {
    placementTest: 0,
    waiting: 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0,
    postponed: 0,
  };

  for (const enrollment of enrollments) {
    byStatus[enrollment.status] += 1;
  }

  return { total: enrollments.length, byStatus };
}

export type SessionProgressRow = {
  scheduledAt: Date;
  status: SessionStatus;
};

export type SessionProgressSummary = {
  total: number;
  completed: number;
  cancelled: number;
  upcoming: number;
  /** Start of the next still-scheduled session, or `null` if there isn't one. */
  nextAt: Date | null;
  /** 0–100, rounded. Cancelled sessions are excluded from the denominator. */
  percentComplete: number;
};

/**
 * The attendance placeholder phase-05.md step 6 asks for: real session counts,
 * no invented per-trainee presence. Actual attendance arrives with Phase 6's
 * `session_students`, and inventing a number here would be worse than saying
 * nothing.
 *
 * A cancelled session counts toward neither side of the ratio — a class that
 * was called off is not progress made, and it is not progress outstanding
 * either.
 */
export function summarizeSessions(
  sessions: readonly SessionProgressRow[],
  now: Date,
): SessionProgressSummary {
  let completed = 0;
  let cancelled = 0;
  let upcoming = 0;
  let nextAt: Date | null = null;

  for (const session of sessions) {
    if (session.status === "completed") completed += 1;
    else if (session.status === "cancelled") cancelled += 1;

    const isFutureScheduled =
      session.status === "scheduled" &&
      session.scheduledAt.getTime() > now.getTime();

    if (isFutureScheduled) {
      upcoming += 1;
      if (nextAt === null || session.scheduledAt.getTime() < nextAt.getTime()) {
        nextAt = session.scheduledAt;
      }
    }
  }

  const countable = sessions.length - cancelled;

  return {
    total: sessions.length,
    completed,
    cancelled,
    upcoming,
    nextAt,
    percentComplete:
      countable === 0 ? 0 : Math.round((completed / countable) * 100),
  };
}
