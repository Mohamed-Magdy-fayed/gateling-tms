import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gt, lt, sql } from "drizzle-orm";
import {
  AnswersTable,
  QuestionsTable,
  type QuestionType,
} from "@/drizzle/schema";
import type {
  AnswerDeleteInput,
  AnswerMoveInput,
  AnswerMutationInput,
  AnswerUpdateInput,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

/**
 * Every answer row on a short-answer question is a wording the grader accepts
 * — a row with `isCorrect` false would be compared against by nothing and do
 * silent no work. The admin dialog already hides the toggle, but this is a
 * public tRPC mutation, so the rule belongs here too rather than only in the
 * UI that happens to call it today.
 *
 * Choice questions are untouched, which is also what makes converting a
 * choice question to a short answer behave: its distractors keep saying they
 * are not accepted, instead of all becoming accepted wordings.
 */
function resolveIsCorrect(questionType: QuestionType, requested: boolean) {
  return questionType === "short_answer" ? true : requested;
}

export async function createAnswer(
  ctx: OrgTRPCContext,
  input: AnswerMutationInput,
) {
  return ctx.db.transaction(async (trx) => {
    // Locks the question row for the rest of the transaction so two
    // concurrent creates against the same question can't both observe the
    // same `order` allocation and insert duplicates — same pattern as
    // questions/server/mutations.ts's createQuestion.
    const [question] = await trx
      .select({ id: QuestionsTable.id, type: QuestionsTable.type })
      .from(QuestionsTable)
      .where(
        and(
          eq(QuestionsTable.id, input.questionId),
          eq(QuestionsTable.organizationId, ctx.organizationId),
        ),
      )
      .for("update");

    if (!question) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    // `max(order) + 1` rather than `count()` — deleting an answer never
    // renumbers its surviving siblings, so a plain count of remaining rows
    // can collide with an order value a surviving row already holds. Same
    // fix as sections/questions' createX (CodeRabbit PR #24), applied here
    // proactively since this mutation copies the identical pattern.
    const [{ value: maxOrder }] = await trx
      .select({
        value: sql<number>`coalesce(max(${AnswersTable.order}), -1)`,
      })
      .from(AnswersTable)
      .where(eq(AnswersTable.questionId, input.questionId));

    const [answer] = await trx
      .insert(AnswersTable)
      .values({
        organizationId: ctx.organizationId,
        questionId: input.questionId,
        text: input.text,
        isCorrect: resolveIsCorrect(question.type, input.isCorrect),
        order: Number(maxOrder) + 1,
      })
      .returning({ id: AnswersTable.id });

    return { id: answer.id };
  });
}

export async function updateAnswer(
  ctx: OrgTRPCContext,
  input: AnswerUpdateInput,
) {
  return ctx.db.transaction(async (trx) => {
    // The input only carries the answer id, but the question's type is what
    // decides whether `isCorrect` is the caller's to set.
    const [target] = await trx
      .select({ questionId: AnswersTable.questionId })
      .from(AnswersTable)
      .where(
        and(
          eq(AnswersTable.id, input.id),
          eq(AnswersTable.organizationId, ctx.organizationId),
        ),
      );

    if (!target) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    // Reading the type and writing the answer must not be two independent
    // statements: a concurrent `updateQuestion` switching the question to (or
    // away from) `short_answer` in between would leave this row normalized
    // against a type it no longer has. `updateQuestion` is a plain UPDATE, but
    // it still blocks on this row lock, so the two serialize — same lock
    // `createAnswer` already takes for its `order` allocation.
    const [question] = await trx
      .select({ type: QuestionsTable.type })
      .from(QuestionsTable)
      .where(
        and(
          eq(QuestionsTable.id, target.questionId),
          eq(QuestionsTable.organizationId, ctx.organizationId),
        ),
      )
      .for("update");

    if (!question) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    const [updated] = await trx
      .update(AnswersTable)
      .set({
        text: input.text,
        isCorrect: resolveIsCorrect(question.type, input.isCorrect),
      })
      .where(
        and(
          eq(AnswersTable.id, input.id),
          eq(AnswersTable.organizationId, ctx.organizationId),
        ),
      )
      .returning({ id: AnswersTable.id });

    if (!updated) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    return { updated: true };
  });
}

export async function deleteAnswer(
  ctx: OrgTRPCContext,
  input: AnswerDeleteInput,
) {
  const [deleted] = await ctx.db
    .delete(AnswersTable)
    .where(
      and(
        eq(AnswersTable.id, input.id),
        eq(AnswersTable.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: AnswersTable.id });

  if (!deleted) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { deleted: true };
}

// Swaps `order` with the adjacent sibling on the same question rather than
// renumbering the whole list — same reasoning as questions/server/mutations.ts's
// moveQuestion. Locking the question row also serializes this against
// createAnswer's order allocation for the same question.
export async function moveAnswer(ctx: OrgTRPCContext, input: AnswerMoveInput) {
  return ctx.db.transaction(async (trx) => {
    // Only resolves which question to lock — its `order` isn't trusted yet,
    // since a concurrent move on this exact answer could still land between
    // this read and the lock below.
    const pre = await trx.query.AnswersTable.findFirst({
      where: and(
        eq(AnswersTable.id, input.id),
        eq(AnswersTable.organizationId, ctx.organizationId),
      ),
      columns: { questionId: true },
    });

    if (!pre) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    const [question] = await trx
      .select({ id: QuestionsTable.id })
      .from(QuestionsTable)
      .where(
        and(
          eq(QuestionsTable.id, pre.questionId),
          eq(QuestionsTable.organizationId, ctx.organizationId),
        ),
      )
      .for("update");

    if (!question) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    // Re-read now that the question row is locked, so `current.order` is
    // authoritative — a concurrent move could have changed it between the
    // pre-lock read above and this point.
    const current = await trx.query.AnswersTable.findFirst({
      where: and(
        eq(AnswersTable.id, input.id),
        eq(AnswersTable.organizationId, ctx.organizationId),
      ),
      columns: { id: true, questionId: true, order: true },
    });

    if (!current) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    const neighbor = await trx.query.AnswersTable.findFirst({
      where: and(
        eq(AnswersTable.questionId, current.questionId),
        eq(AnswersTable.organizationId, ctx.organizationId),
        input.direction === "up"
          ? lt(AnswersTable.order, current.order)
          : gt(AnswersTable.order, current.order),
      ),
      orderBy:
        input.direction === "up"
          ? desc(AnswersTable.order)
          : asc(AnswersTable.order),
      columns: { id: true, order: true },
    });

    // Already first/last — nothing to swap with, not an error.
    if (!neighbor) return { moved: false };

    await trx
      .update(AnswersTable)
      .set({ order: neighbor.order })
      .where(eq(AnswersTable.id, current.id));
    await trx
      .update(AnswersTable)
      .set({ order: current.order })
      .where(eq(AnswersTable.id, neighbor.id));

    return { moved: true };
  });
}
