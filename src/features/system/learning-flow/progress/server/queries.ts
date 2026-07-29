import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import {
  EnrollmentLevelsTable,
  EnrollmentsTable,
  GroupStudentsTable,
  GroupsTable,
  LevelsTable,
  SessionStudentsTable,
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
    )
    .orderBy(desc(EnrollmentsTable.createdAt), desc(EnrollmentsTable.id));

  // A repeat student is normal — `createEnrollment` blocks only a *second
  // active* enrollment in a course, so a trainee who finished or cancelled one
  // and signed up again has two rows for it. The status tiles count every row
  // (finishing a course and restarting it really is one completed and one
  // ongoing), but the curriculum figures must not: counting the same course's
  // levels twice would report a trainee who is 4/5 through their retake as
  // 6/10. The newest enrollment per course is the one they're on now.
  const latestByCourse = new Map<string, (typeof enrollments)[number]>();
  for (const enrollment of enrollments) {
    if (!latestByCourse.has(enrollment.courseId)) {
      latestByCourse.set(enrollment.courseId, enrollment);
    }
  }
  const currentEnrollments = [...latestByCourse.values()];

  // Driven by each course's own level list with a LEFT JOIN onto
  // `enrollment_levels`, exactly like `listEnrollmentLevels`: a level added to
  // the course later counts as not started instead of being invisible.
  // Independent of each other, so they go out together rather than costing
  // two sequential round trips.
  const [levelRows, sessions] = await Promise.all([
    currentEnrollments.length
      ? ctx.db
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
              currentEnrollments.map((enrollment) => enrollment.id),
            ),
          )
      : [],
    // Sessions of every group the trainee is on, each carrying whatever
    // attendance is recorded for *this* trainee — a LEFT JOIN, because a class
    // nobody marked and Zoom never saw has no row and must not read as an
    // absence (phase-06.md step 6 closes phase-05.md step 6's placeholder).
    ctx.db
      .select({
        scheduledAt: SessionsTable.scheduledAt,
        status: SessionsTable.status,
        attendance: SessionStudentsTable.status,
      })
      .from(SessionsTable)
      .innerJoin(
        GroupStudentsTable,
        eq(GroupStudentsTable.groupId, SessionsTable.groupId),
      )
      .leftJoin(
        SessionStudentsTable,
        and(
          eq(SessionStudentsTable.sessionId, SessionsTable.id),
          eq(SessionStudentsTable.traineeId, GroupStudentsTable.traineeId),
          eq(
            SessionStudentsTable.organizationId,
            SessionsTable.organizationId,
          ),
        ),
      )
      .where(
        and(
          eq(SessionsTable.organizationId, ctx.organizationId),
          eq(GroupStudentsTable.traineeId, traineeId),
        ),
      ),
  ]);

  const levelsByEnrollment = new Map<string, LevelProgressRow[]>();
  for (const row of levelRows) {
    const existing = levelsByEnrollment.get(row.enrollmentId);
    if (existing) existing.push({ status: row.status });
    else levelsByEnrollment.set(row.enrollmentId, [{ status: row.status }]);
  }

  const allLevels = currentEnrollments.flatMap(
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

  const [sessions, roster] = await Promise.all([
    ctx.db
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
      ),
    ctx.db
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
      .orderBy(asc(TraineesTable.name), asc(TraineesTable.id)),
  ]);

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
    )
    .orderBy(desc(EnrollmentsTable.createdAt), desc(EnrollmentsTable.id));

  // Same rule as `getTraineeProgress`: a repeat student has more than one row
  // for this course, so the newest is the one their place in the class is read
  // from. Without the ordering the row was whichever the scan happened to
  // return last, which could differ between two loads of the same page.
  const enrollmentByTrainee = new Map<string, (typeof enrollments)[number]>();
  for (const enrollment of enrollments) {
    if (!enrollmentByTrainee.has(enrollment.traineeId)) {
      enrollmentByTrainee.set(enrollment.traineeId, enrollment);
    }
  }

  // Only the enrollments actually rendered — a superseded one from an earlier
  // attempt is never read out of the map below, so there is no point fetching
  // its levels.
  const currentEnrollmentIds = [...enrollmentByTrainee.values()].map(
    (enrollment) => enrollment.id,
  );

  const [courseLevels, touchedLevels] = await Promise.all([
    // The course's full level list is the denominator for everyone on the
    // roster, so it is fetched once rather than per trainee.
    ctx.db
      .select({ id: LevelsTable.id })
      .from(LevelsTable)
      .where(
        and(
          eq(LevelsTable.courseId, courseId),
          eq(LevelsTable.organizationId, ctx.organizationId),
        ),
      ),
    currentEnrollmentIds.length
      ? ctx.db
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
                currentEnrollmentIds,
              ),
            ),
          )
      : [],
  ]);

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
