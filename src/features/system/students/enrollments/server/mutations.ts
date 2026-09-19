import { TRPCError } from "@trpc/server";
import { and, eq, inArray, isNull } from "drizzle-orm";
import {
  CoursesTable,
  EnrollmentLevelsTable,
  EnrollmentsTable,
  LevelsTable,
  TraineesTable,
} from "@/drizzle/schema";
import {
  assertValidTransition,
  ENROLLMENT_TRANSITIONS,
} from "../../status-transitions";
import type {
  EnrollmentDeleteInput,
  EnrollmentLevelStatusInput,
  EnrollmentMutationInput,
  EnrollmentStatusInput,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

// Statuses that still represent a live enrollment. A trainee can be enrolled
// in the same course again after finishing or cancelling — a repeat student is
// normal — but not twice at once.
const ACTIVE_ENROLLMENT_STATUSES = [
  "placementTest",
  "waiting",
  "ongoing",
  "postponed",
] as const;

/**
 * `enrollments` reaches both trainees and courses through composite
 * (organizationId, x) FKs, so the database already rejects a cross-org id —
 * but it rejects it as a constraint violation. Checking here turns that into a
 * localized "which one is missing" message, and covers the soft-deleted case
 * the FK can't see.
 *
 * There is no unique constraint backing the "not enrolled twice at once" rule
 * (it depends on status, which changes over the enrollment's life), so the
 * trainee row is locked for the rest of the transaction — otherwise two
 * concurrent requests both read "no active enrollment" and both insert.
 */
export async function createEnrollment(
  ctx: OrgTRPCContext,
  input: EnrollmentMutationInput,
) {
  return ctx.db.transaction(async (trx) => {
    const [trainee] = await trx
      .select({ id: TraineesTable.id })
      .from(TraineesTable)
      .where(
        and(
          eq(TraineesTable.id, input.traineeId),
          eq(TraineesTable.organizationId, ctx.organizationId),
          isNull(TraineesTable.deletedAt),
        ),
      )
      .for("update");

    if (!trainee) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("enrollments.traineeNotFound"),
      });
    }

    const course = await trx.query.CoursesTable.findFirst({
      where: and(
        eq(CoursesTable.id, input.courseId),
        eq(CoursesTable.organizationId, ctx.organizationId),
        isNull(CoursesTable.deletedAt),
      ),
      columns: { id: true },
    });

    if (!course) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("enrollments.courseNotFound"),
      });
    }

    const existing = await trx.query.EnrollmentsTable.findFirst({
      where: and(
        eq(EnrollmentsTable.organizationId, ctx.organizationId),
        eq(EnrollmentsTable.traineeId, input.traineeId),
        eq(EnrollmentsTable.courseId, input.courseId),
        inArray(EnrollmentsTable.status, ACTIVE_ENROLLMENT_STATUSES),
      ),
      columns: { id: true },
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: ctx.t("enrollments.alreadyEnrolled"),
      });
    }

    const [enrollment] = await trx
      .insert(EnrollmentsTable)
      .values({
        organizationId: ctx.organizationId,
        traineeId: input.traineeId,
        courseId: input.courseId,
        status: input.status,
      })
      .returning({ id: EnrollmentsTable.id });

    return { id: enrollment.id };
  });
}

export async function updateEnrollmentStatus(
  ctx: OrgTRPCContext,
  input: EnrollmentStatusInput,
) {
  return ctx.db.transaction(async (trx) => {
    // Locked before the current status is read, not after: reading first lets
    // two concurrent updates each validate against a status the other is
    // already replacing, and the second one to commit wins with a transition
    // that was never legal. This read-then-lock inversion is the same bug
    // class as STATE.md D75(3) and D83(2).
    const [current] = await trx
      .select({ status: EnrollmentsTable.status })
      .from(EnrollmentsTable)
      .where(
        and(
          eq(EnrollmentsTable.id, input.id),
          eq(EnrollmentsTable.organizationId, ctx.organizationId),
        ),
      )
      .for("update");

    if (!current) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    assertValidTransition(
      ENROLLMENT_TRANSITIONS,
      current.status,
      input.status,
      ctx.t("enrollments.invalidTransition"),
    );

    await trx
      .update(EnrollmentsTable)
      .set({ status: input.status })
      .where(eq(EnrollmentsTable.id, input.id));

    return { updated: true, status: input.status };
  });
}

/**
 * Records progress on one level of the enrollment's course.
 *
 * An upsert against the existing unique(enrollmentId, levelId) rather than an
 * update: `enrollment_levels` rows are created the first time a level is
 * actually touched, which is why nothing is seeded at enrollment time (see
 * `listEnrollmentLevels`).
 */
export async function setEnrollmentLevelStatus(
  ctx: OrgTRPCContext,
  input: EnrollmentLevelStatusInput,
) {
  const [enrollment] = await ctx.db
    .select({ courseId: EnrollmentsTable.courseId })
    .from(EnrollmentsTable)
    .where(
      and(
        eq(EnrollmentsTable.id, input.enrollmentId),
        eq(EnrollmentsTable.organizationId, ctx.organizationId),
      ),
    );

  if (!enrollment) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  // The level has to belong to this org *and* to the course the trainee is
  // enrolled in — otherwise progress could be recorded against an unrelated
  // course's level, which the (organizationId, levelId) FK would happily allow.
  const level = await ctx.db.query.LevelsTable.findFirst({
    where: and(
      eq(LevelsTable.id, input.levelId),
      eq(LevelsTable.organizationId, ctx.organizationId),
      eq(LevelsTable.courseId, enrollment.courseId),
    ),
    columns: { id: true },
  });

  if (!level) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("enrollments.levelNotFound"),
    });
  }

  const completedAt = input.status === "completed" ? new Date() : null;

  await ctx.db
    .insert(EnrollmentLevelsTable)
    .values({
      organizationId: ctx.organizationId,
      enrollmentId: input.enrollmentId,
      levelId: input.levelId,
      status: input.status,
      completedAt,
    })
    .onConflictDoUpdate({
      target: [
        EnrollmentLevelsTable.enrollmentId,
        EnrollmentLevelsTable.levelId,
      ],
      // Cleared when a level is reopened, so a stale completion date can't
      // outlive the completion it recorded.
      set: { status: input.status, completedAt },
    });

  return { status: input.status };
}

// Hard delete — `enrollments` carries no soft-delete columns, and its
// `enrollment_levels` rows go with it via ON DELETE CASCADE. The trainee, the
// course, and any certificate already issued are untouched.
export async function deleteEnrollment(
  ctx: OrgTRPCContext,
  input: EnrollmentDeleteInput,
) {
  const [deleted] = await ctx.db
    .delete(EnrollmentsTable)
    .where(
      and(
        eq(EnrollmentsTable.id, input.id),
        eq(EnrollmentsTable.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: EnrollmentsTable.id });

  if (!deleted) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { deleted: true };
}
