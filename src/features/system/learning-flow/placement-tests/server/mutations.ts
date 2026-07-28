import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import {
  EnrollmentLevelsTable,
  EnrollmentsTable,
  FormResponsesTable,
  FormsTable,
  LevelsTable,
  PlacementTestsTable,
  TraineesTable,
} from "@/drizzle/schema";
import {
  getScorableQuestions,
  scoreFormResponse,
} from "@/features/system/assessments/responses/server";
import {
  assertValidTransition,
  PLACEMENT_TEST_TRANSITIONS,
} from "../../status-transitions";
import type {
  PlacementTestAttemptInput,
  PlacementTestDeleteInput,
  PlacementTestMutationInput,
  PlacementTestReviewInput,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

/**
 * `formId` is a plain single-column FK (STATE.md D79 — a composite one would
 * break ON DELETE SET NULL), so nothing at the database level stops it
 * pointing at another organization's form. This check is the only thing that
 * does.
 */
async function assertAssignableForm(ctx: OrgTRPCContext, formId: string) {
  const form = await ctx.db.query.FormsTable.findFirst({
    where: and(
      eq(FormsTable.id, formId),
      eq(FormsTable.organizationId, ctx.organizationId),
    ),
    columns: { id: true, type: true, status: true },
  });

  if (!form) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("placementTests.formNotFound"),
    });
  }

  if (form.type !== "placement") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: ctx.t("placementTests.formNotPlacement"),
    });
  }

  // Assigning a draft would let its questions change under a trainee who is
  // part-way through it.
  if (form.status !== "published") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: ctx.t("placementTests.formNotPublished"),
    });
  }
}

/** Same story as the form: `assignedLevelId` is a plain FK, so check it here. */
async function assertLevelInOrg(ctx: OrgTRPCContext, levelId: string) {
  const level = await ctx.db.query.LevelsTable.findFirst({
    where: and(
      eq(LevelsTable.id, levelId),
      eq(LevelsTable.organizationId, ctx.organizationId),
    ),
    columns: { id: true, courseId: true },
  });

  if (!level) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("placementTests.levelNotFound"),
    });
  }

  return level;
}

export async function createPlacementTest(
  ctx: OrgTRPCContext,
  input: PlacementTestMutationInput,
) {
  const trainee = await ctx.db.query.TraineesTable.findFirst({
    where: and(
      eq(TraineesTable.id, input.traineeId),
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

  await assertAssignableForm(ctx, input.formId);

  const [placementTest] = await ctx.db
    .insert(PlacementTestsTable)
    .values({
      organizationId: ctx.organizationId,
      traineeId: input.traineeId,
      formId: input.formId,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
    })
    .returning({ id: PlacementTestsTable.id });

  return { id: placementTest.id };
}

/**
 * Records the trainee's answers, scores them, and moves the test to
 * `inProgress` — awaiting a level assignment.
 *
 * Trainees have no accounts (STATE.md D77) and `form_responses` requires a
 * real `respondentUserId`, so the response is attributed to the staff member
 * who administered the test rather than invented. Scoring goes through the
 * assessments module's own scorer, so a placement test and a quiz can't drift
 * apart on how a score is computed.
 */
export async function recordPlacementAttempt(
  ctx: OrgTRPCContext,
  input: PlacementTestAttemptInput,
) {
  const session = ctx.session;
  if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });

  return ctx.db.transaction(async (trx) => {
    // Locked before its status and formId are read, so two staff members
    // submitting the same test can't both pass the "not recorded yet" check
    // and produce two responses (the read-then-lock inversion of D75(3)/D83(2)).
    const [current] = await trx
      .select({
        formId: PlacementTestsTable.formId,
        responseId: PlacementTestsTable.responseId,
        status: PlacementTestsTable.status,
      })
      .from(PlacementTestsTable)
      .where(
        and(
          eq(PlacementTestsTable.id, input.id),
          eq(PlacementTestsTable.organizationId, ctx.organizationId),
        ),
      )
      .for("update");

    if (!current) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    if (current.responseId) {
      throw new TRPCError({
        code: "CONFLICT",
        message: ctx.t("placementTests.alreadyRecorded"),
      });
    }

    if (!current.formId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: ctx.t("placementTests.noFormAssigned"),
      });
    }

    assertValidTransition(
      PLACEMENT_TEST_TRANSITIONS,
      current.status,
      "inProgress",
      ctx.t("enrollments.invalidTransition"),
    );

    // Read through `trx`, not `ctx.db`: the latter would check out a second
    // connection and read outside this transaction's snapshot while it holds
    // the placement test's row lock.
    const questions = await getScorableQuestions(
      { ...ctx, db: trx },
      current.formId,
    );
    const score = scoreFormResponse(questions, input.answers);

    const [response] = await trx
      .insert(FormResponsesTable)
      .values({
        organizationId: ctx.organizationId,
        formId: current.formId,
        respondentUserId: session.user.id,
        answers: input.answers,
        score,
      })
      .returning({ id: FormResponsesTable.id });

    await trx
      .update(PlacementTestsTable)
      .set({ responseId: response.id, status: "inProgress" })
      .where(eq(PlacementTestsTable.id, input.id));

    return { responseId: response.id, score };
  });
}

/**
 * Assigns the resulting level and closes the test.
 *
 * This is where a placement test "feeds the enrollment level" (phase-05.md
 * step 5): if the trainee is waiting on placement for the level's own course,
 * that enrollment advances to `waiting` and the assigned level is marked
 * `inProgress`, so the reviewer doesn't have to go and do it by hand.
 */
export async function reviewPlacementTest(
  ctx: OrgTRPCContext,
  input: PlacementTestReviewInput,
) {
  const level = await assertLevelInOrg(ctx, input.assignedLevelId);

  return ctx.db.transaction(async (trx) => {
    const [current] = await trx
      .select({
        traineeId: PlacementTestsTable.traineeId,
        responseId: PlacementTestsTable.responseId,
        status: PlacementTestsTable.status,
      })
      .from(PlacementTestsTable)
      .where(
        and(
          eq(PlacementTestsTable.id, input.id),
          eq(PlacementTestsTable.organizationId, ctx.organizationId),
        ),
      )
      .for("update");

    if (!current) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    if (!current.responseId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: ctx.t("placementTests.notRecorded"),
      });
    }

    assertValidTransition(
      PLACEMENT_TEST_TRANSITIONS,
      current.status,
      "completed",
      ctx.t("enrollments.invalidTransition"),
    );

    await trx
      .update(PlacementTestsTable)
      .set({
        assignedLevelId: input.assignedLevelId,
        feedback: input.feedback || null,
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(PlacementTestsTable.id, input.id));

    const [enrollment] = await trx
      .select({ id: EnrollmentsTable.id })
      .from(EnrollmentsTable)
      .where(
        and(
          eq(EnrollmentsTable.organizationId, ctx.organizationId),
          eq(EnrollmentsTable.traineeId, current.traineeId),
          eq(EnrollmentsTable.courseId, level.courseId),
          eq(EnrollmentsTable.status, "placementTest"),
        ),
      )
      .for("update");

    // No such enrollment is normal, not an error: a placement test can be run
    // before anyone decides which course the trainee will take.
    if (!enrollment) {
      return { reviewed: true, enrollmentAdvanced: false };
    }

    await trx
      .update(EnrollmentsTable)
      .set({ status: "waiting" })
      .where(eq(EnrollmentsTable.id, enrollment.id));

    await trx
      .insert(EnrollmentLevelsTable)
      .values({
        organizationId: ctx.organizationId,
        enrollmentId: enrollment.id,
        levelId: input.assignedLevelId,
        status: "inProgress",
      })
      .onConflictDoUpdate({
        target: [
          EnrollmentLevelsTable.enrollmentId,
          EnrollmentLevelsTable.levelId,
        ],
        set: { status: "inProgress" },
      });

    return { reviewed: true, enrollmentAdvanced: true };
  });
}

export async function cancelPlacementTest(
  ctx: OrgTRPCContext,
  input: PlacementTestDeleteInput,
) {
  return ctx.db.transaction(async (trx) => {
    const [current] = await trx
      .select({ status: PlacementTestsTable.status })
      .from(PlacementTestsTable)
      .where(
        and(
          eq(PlacementTestsTable.id, input.id),
          eq(PlacementTestsTable.organizationId, ctx.organizationId),
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
      PLACEMENT_TEST_TRANSITIONS,
      current.status,
      "cancelled",
      ctx.t("enrollments.invalidTransition"),
    );

    await trx
      .update(PlacementTestsTable)
      .set({ status: "cancelled" })
      .where(eq(PlacementTestsTable.id, input.id));

    return { cancelled: true };
  });
}

// Hard delete — `placement_tests` has no soft-delete columns. Any recorded
// response stays in the form's own responses; only the assignment goes.
export async function deletePlacementTest(
  ctx: OrgTRPCContext,
  input: PlacementTestDeleteInput,
) {
  const [deleted] = await ctx.db
    .delete(PlacementTestsTable)
    .where(
      and(
        eq(PlacementTestsTable.id, input.id),
        eq(PlacementTestsTable.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: PlacementTestsTable.id });

  if (!deleted) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { deleted: true };
}
