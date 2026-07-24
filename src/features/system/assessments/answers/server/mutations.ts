import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, gt, lt } from "drizzle-orm";
import { AnswersTable, QuestionsTable } from "@/drizzle/schema";
import type {
  AnswerDeleteInput,
  AnswerMoveInput,
  AnswerMutationInput,
  AnswerUpdateInput,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

export async function createAnswer(
  ctx: OrgTRPCContext,
  input: AnswerMutationInput,
) {
  return ctx.db.transaction(async (trx) => {
    // Locks the question row for the rest of the transaction so two
    // concurrent creates against the same question can't both observe the
    // same `order` count and insert duplicates — same pattern as
    // questions/server/mutations.ts's createQuestion.
    const [question] = await trx
      .select({ id: QuestionsTable.id })
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

    const [{ value: existingCount }] = await trx
      .select({ value: count() })
      .from(AnswersTable)
      .where(eq(AnswersTable.questionId, input.questionId));

    const [answer] = await trx
      .insert(AnswersTable)
      .values({
        organizationId: ctx.organizationId,
        questionId: input.questionId,
        text: input.text,
        isCorrect: input.isCorrect,
        order: Number(existingCount),
      })
      .returning({ id: AnswersTable.id });

    return { id: answer.id };
  });
}

export async function updateAnswer(
  ctx: OrgTRPCContext,
  input: AnswerUpdateInput,
) {
  const [updated] = await ctx.db
    .update(AnswersTable)
    .set({ text: input.text, isCorrect: input.isCorrect })
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

    const [question] = await trx
      .select({ id: QuestionsTable.id })
      .from(QuestionsTable)
      .where(
        and(
          eq(QuestionsTable.id, current.questionId),
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
