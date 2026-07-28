import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import {
  EnrollmentLevelsTable,
  EnrollmentsTable,
  GroupStudentsTable,
  GroupsTable,
  LevelsTable,
  SessionsTable,
  TraineesTable,
} from "@/drizzle/schema";
import {
  type LevelProgressRow,
  summarizeEnrollmentStatuses,
  summarizeLevels,
  summarizeSessions,
} from "./progress";
import type { OrgTRPCContext } from "./types";

/**
 * Per-trainee progress (phase-05.md step 6).
 *
 * Levels are fetched for every enrollment in one query and grouped in memory
 * rather than one query per enrollment — a trainee with six courses would
 * otherwise cost six round trips for a single card.
 */
export async function getTraineeProgress(
  ctx: OrgTRPCContext,
  traineeId: string,
) {
  const trainee = await ctx.db.query.TraineesTable.findFirst({
    where: and(
      eq(TraineesTable.id, traineeId),
      eq(TraineesTable.organizationId, ctx.organizationId),
      isNull(TraineesTable.deletedAt),
    ),
    columns: { id: true },
  });

  if (!trainee) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("enrollments.traineeNotFound"),
    });
  }

  const enrollments = await ctx.db
    .select({
      id: EnrollmentsTable.id,
      courseId: EnrollmentsTable.courseId,
      status: EnrollmentsTable.status,
    })
    .from(EnrollmentsTable)
    .where(
      and(
        eq(EnrollmentsTable.organizationId, ctx.organizationId),
        eq(EnrollmentsTable.traineeId, traineeId),
      ),
    );

  // Driven by each course's own level list with a LEFT JOIN onto
  // `enrollment_levels`, exactly like `listEnrollmentLevels`: a level added to
  // the course later counts as not started instead of being invisible.
  const levelRows = enrollments.length
    ? await ctx.db
        .select({
          enrollmentId: EnrollmentsTable.id,
          status: EnrollmentLevelsTable.status,
        })
        .from(EnrollmentsTable)
        .innerJoin(
          LevelsTable,
          and(
            eq(LevelsTable.courseId, EnrollmentsTable.courseId),
            eq(LevelsTable.organizationId, ctx.organizationId),
          ),
        )
        .leftJoin(
          EnrollmentLevelsTable,
          and(
            eq(EnrollmentLevelsTable.enrollmentId, EnrollmentsTable.id),
            eq(EnrollmentLevelsTable.levelId, LevelsTable.id),
          ),
        )
        .where(
          inArray(
            EnrollmentsTable.id,
            enrollments.map((enrollment) => enrollment.id),
          ),
        )
    : [];

  const levelsByEnrollment = new Map<string, LevelProgressRow[]>();
  for (const row of levelRows) {
    const existing = levelsByEnrollment.get(row.enrollmentId);
    if (existing) existing.push({ status: row.status });
    else levelsByEnrollment.set(row.enrollmentId, [{ status: row.status }]);
  }

  // Sessions of every group the trainee is on. This is phase-05.md step 6's
  // "attendance summary placeholder" — real per-trainee attendance needs
  // Phase 6's session_students, so what is reported here is the class
  // schedule, not presence.
  const sessions = await ctx.db
    .select({
      scheduledAt: SessionsTable.scheduledAt,
      status: SessionsTable.status,
    })
    .from(SessionsTable)
    .innerJoin(
      GroupStudentsTable,
      eq(GroupStudentsTable.groupId, SessionsTable.groupId),
    )
    .where(
      and(
        eq(SessionsTable.organizationId, ctx.organizationId),
        eq(GroupStudentsTable.traineeId, traineeId),
      ),
    );

  const allLevels = enrollments.flatMap(
    (enrollment) => levelsByEnrollment.get(enrollment.id) ?? [],
  );

  return {
    enrollments: summarizeEnrollmentStatuses(enrollments),
    levels: summarizeLevels(allLevels),
    sessions: summarizeSessions(sessions, new Date()),
  };
}

/**
 * Per-group progress (phase-05.md step 6): how far the class itself has got,
 * plus where each trainee on the roster stands in the group's course.
 *
 * A group needs no course (STATE.md D77(3)); when it has none, `students`
 * carries roster names with no curriculum figures rather than zeros that would
 * read as "nobody has done anything".
 */
export async function getGroupProgress(ctx: OrgTRPCContext, groupId: string) {
  const group = await ctx.db.query.GroupsTable.findFirst({
    where: and(
      eq(GroupsTable.id, groupId),
      eq(GroupsTable.organizationId, ctx.organizationId),
    ),
    columns: { id: true, courseId: true },
  });

  if (!group) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  const sessions = await ctx.db
    .select({
      scheduledAt: SessionsTable.scheduledAt,
      status: SessionsTable.status,
    })
    .from(SessionsTable)
    .where(
      and(
        eq(SessionsTable.organizationId, ctx.organizationId),
        eq(SessionsTable.groupId, groupId),
      ),
    );

  const roster = await ctx.db
    .select({
      traineeId: TraineesTable.id,
      traineeName: TraineesTable.name,
    })
    .from(GroupStudentsTable)
    .innerJoin(
      TraineesTable,
      and(
        eq(TraineesTable.id, GroupStudentsTable.traineeId),
        isNull(TraineesTable.deletedAt),
      ),
    )
    .where(
      and(
        eq(GroupStudentsTable.organizationId, ctx.organizationId),
        eq(GroupStudentsTable.groupId, groupId),
      ),
    )
    .orderBy(asc(TraineesTable.name), asc(TraineesTable.id));

  const sessionSummary = summarizeSessions(sessions, new Date());

  if (!group.courseId || roster.length === 0) {
    return {
      courseId: group.courseId,
      sessions: sessionSummary,
      students: roster.map((student) => ({
        ...student,
        status: null,
        levels: null,
      })),
    };
  }

  const courseId = group.courseId;

  const enrollments = await ctx.db
    .select({
      id: EnrollmentsTable.id,
      traineeId: EnrollmentsTable.traineeId,
      status: EnrollmentsTable.status,
    })
    .from(EnrollmentsTable)
    .where(
      and(
        eq(EnrollmentsTable.organizationId, ctx.organizationId),
        eq(EnrollmentsTable.courseId, courseId),
        inArray(
          EnrollmentsTable.traineeId,
          roster.map((student) => student.traineeId),
        ),
      ),
    );

  const enrollmentByTrainee = new Map(
    enrollments.map((enrollment) => [enrollment.traineeId, enrollment]),
  );

  // The course's full level list is the denominator for everyone on the
  // roster, so it is fetched once rather than per trainee.
  const courseLevels = await ctx.db
    .select({ id: LevelsTable.id })
    .from(LevelsTable)
    .where(
      and(
        eq(LevelsTable.courseId, courseId),
        eq(LevelsTable.organizationId, ctx.organizationId),
      ),
    );

  const touchedLevels = enrollments.length
    ? await ctx.db
        .select({
          enrollmentId: EnrollmentLevelsTable.enrollmentId,
          levelId: EnrollmentLevelsTable.levelId,
          status: EnrollmentLevelsTable.status,
        })
        .from(EnrollmentLevelsTable)
        .where(
          and(
            eq(EnrollmentLevelsTable.organizationId, ctx.organizationId),
            inArray(
              EnrollmentLevelsTable.enrollmentId,
              enrollments.map((enrollment) => enrollment.id),
            ),
          ),
        )
    : [];

  const statusByEnrollmentLevel = new Map(
    touchedLevels.map((row) => [
      `${row.enrollmentId}:${row.levelId}`,
      row.status,
    ]),
  );

  return {
    courseId,
    sessions: sessionSummary,
    students: roster.map((student) => {
      const enrollment = enrollmentByTrainee.get(student.traineeId);

      if (!enrollment) {
        // On the roster but not enrolled — entirely normal, since group
        // membership works without enrollment (phase-05.md step 4).
        return { ...student, status: null, levels: null };
      }

      return {
        ...student,
        status: enrollment.status,
        levels: summarizeLevels(
          courseLevels.map((level) => ({
            status:
              statusByEnrollmentLevel.get(`${enrollment.id}:${level.id}`) ??
              null,
          })),
        ),
      };
    }),
  };
}
