import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { likeContains } from "@/drizzle/lib/search";
import {
  CoursesTable,
  EnrollmentLevelsTable,
  EnrollmentsTable,
  LevelsTable,
  TraineesTable,
} from "@/drizzle/schema";
import type { ListEnrollmentsInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

function buildWhereClause(ctx: OrgTRPCContext, input: ListEnrollmentsInput) {
  const search = input.globalFilter?.trim();

  return and(
    eq(EnrollmentsTable.organizationId, ctx.organizationId),
    input.traineeId
      ? eq(EnrollmentsTable.traineeId, input.traineeId)
      : undefined,
    input.status ? eq(EnrollmentsTable.status, input.status) : undefined,
    // The list shows who is enrolled in what, so searching those two names is
    // what a user expects — the enrollment itself has no text of its own.
    search
      ? or(
          ilike(TraineesTable.name, likeContains(search)),
          ilike(CoursesTable.name, likeContains(search)),
        )
      : undefined,
  );
}

// Every branch appends `id` as a tiebreaker so ties in the primary sort don't
// leave row order (and therefore offset pagination) nondeterministic — same
// pattern as trainees'/groups' queries.ts (STATE.md D35).
function sortExpr(input: ListEnrollmentsInput) {
  const firstSort = input.sorting[0];
  if (!firstSort) {
    return [desc(EnrollmentsTable.createdAt), asc(EnrollmentsTable.id)];
  }

  switch (firstSort.id) {
    case "traineeName":
      return [
        firstSort.desc ? desc(TraineesTable.name) : asc(TraineesTable.name),
        asc(EnrollmentsTable.id),
      ];
    case "courseName":
      return [
        firstSort.desc ? desc(CoursesTable.name) : asc(CoursesTable.name),
        asc(EnrollmentsTable.id),
      ];
    case "status":
      return [
        firstSort.desc
          ? desc(EnrollmentsTable.status)
          : asc(EnrollmentsTable.status),
        asc(EnrollmentsTable.id),
      ];
    default:
      return [
        firstSort.desc
          ? desc(EnrollmentsTable.createdAt)
          : asc(EnrollmentsTable.createdAt),
        asc(EnrollmentsTable.id),
      ];
  }
}

// Both joins are inner: an enrollment can't exist without its trainee and its
// course (composite FKs, cascade). Soft-deleted ones are excluded so a removed
// trainee or archived course doesn't leave half-blank rows in the list.
const activeTraineeJoin = and(
  eq(TraineesTable.id, EnrollmentsTable.traineeId),
  isNull(TraineesTable.deletedAt),
);

const activeCourseJoin = and(
  eq(CoursesTable.id, EnrollmentsTable.courseId),
  isNull(CoursesTable.deletedAt),
);

export async function listEnrollments(
  ctx: OrgTRPCContext,
  input: ListEnrollmentsInput,
) {
  const whereClause = buildWhereClause(ctx, input);

  const [{ value: total }] = await ctx.db
    .select({ value: count() })
    .from(EnrollmentsTable)
    .innerJoin(TraineesTable, activeTraineeJoin)
    .innerJoin(CoursesTable, activeCourseJoin)
    .where(whereClause);

  const pageCount = Math.max(1, Math.ceil(Number(total) / input.perPage));
  const page = Math.min(input.page, pageCount);
  const offset = (page - 1) * input.perPage;

  const rows = await ctx.db
    .select({
      id: EnrollmentsTable.id,
      traineeId: EnrollmentsTable.traineeId,
      traineeName: TraineesTable.name,
      courseId: EnrollmentsTable.courseId,
      courseName: CoursesTable.name,
      status: EnrollmentsTable.status,
      createdAt: EnrollmentsTable.createdAt,
    })
    .from(EnrollmentsTable)
    .innerJoin(TraineesTable, activeTraineeJoin)
    .innerJoin(CoursesTable, activeCourseJoin)
    .where(whereClause)
    .orderBy(...sortExpr(input))
    .limit(input.perPage)
    .offset(offset);

  return { rows, page, pageCount, total: Number(total) };
}

/**
 * Unlike the list, this doesn't exclude a soft-deleted trainee or course — a
 * link to an existing enrollment must keep resolving so its history stays
 * readable after the roster changes.
 */
export async function getEnrollment(ctx: OrgTRPCContext, id: string) {
  const [enrollment] = await ctx.db
    .select({
      id: EnrollmentsTable.id,
      traineeId: EnrollmentsTable.traineeId,
      traineeName: TraineesTable.name,
      courseId: EnrollmentsTable.courseId,
      courseName: CoursesTable.name,
      status: EnrollmentsTable.status,
      createdAt: EnrollmentsTable.createdAt,
    })
    .from(EnrollmentsTable)
    .innerJoin(TraineesTable, eq(TraineesTable.id, EnrollmentsTable.traineeId))
    .innerJoin(CoursesTable, eq(CoursesTable.id, EnrollmentsTable.courseId))
    .where(
      and(
        eq(EnrollmentsTable.id, id),
        eq(EnrollmentsTable.organizationId, ctx.organizationId),
      ),
    );

  if (!enrollment) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return enrollment;
}

/**
 * Progress across the course's levels.
 *
 * Driven by the course's levels with a LEFT JOIN onto `enrollment_levels`
 * rather than by rows seeded at enrollment time: a level added to the course
 * later still shows up (as `notStarted`) with no backfill, and a level removed
 * from the course stops being reported. `setEnrollmentLevelStatus` upserts the
 * row the first time a level is actually touched.
 */
export async function listEnrollmentLevels(
  ctx: OrgTRPCContext,
  enrollmentId: string,
) {
  const enrollment = await getEnrollment(ctx, enrollmentId);

  return ctx.db
    .select({
      levelId: LevelsTable.id,
      name: LevelsTable.name,
      order: LevelsTable.order,
      status: EnrollmentLevelsTable.status,
      completedAt: EnrollmentLevelsTable.completedAt,
    })
    .from(LevelsTable)
    .leftJoin(
      EnrollmentLevelsTable,
      and(
        eq(EnrollmentLevelsTable.levelId, LevelsTable.id),
        eq(EnrollmentLevelsTable.enrollmentId, enrollment.id),
      ),
    )
    .where(
      and(
        eq(LevelsTable.courseId, enrollment.courseId),
        eq(LevelsTable.organizationId, ctx.organizationId),
      ),
    )
    .orderBy(asc(LevelsTable.order), asc(LevelsTable.id));
}
