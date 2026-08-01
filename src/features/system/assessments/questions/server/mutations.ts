import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { QuestionsTable } from "@/drizzle/schema";
import {
  lockSection,
  moveSectionItem,
  nextItemOrder,
} from "@/features/system/assessments/sections/server/reorder";
import type {
  QuestionDeleteInput,
  QuestionMoveInput,
  QuestionMutationInput,
  QuestionUpdateInput,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

export async function createQuestion(
  ctx: OrgTRPCContext,
  input: QuestionMutationInput,
) {
  return ctx.db.transaction(async (trx) => {
    // The order sequence is shared with the section's content blocks, so both
    // the lock and the allocation live in `sections/server/reorder.ts` — a
    // question and a block created at the same moment must not be handed the
    // same position.
    if (!(await lockSection(trx, ctx.organizationId, input.sectionId))) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    const [question] = await trx
      .insert(QuestionsTable)
      .values({
        organizationId: ctx.organizationId,
        sectionId: input.sectionId,
        text: input.text,
        description: input.description || null,
        type: input.type,
        points: input.points,
        isRequired: input.isRequired,
        imageUrl: input.imageUrl || null,
        imageAlt: input.imageAlt || null,
        order: await nextItemOrder(trx, input.sectionId),
      })
      .returning({ id: QuestionsTable.id });

    return { id: question.id };
  });
}

export async function updateQuestion(
  ctx: OrgTRPCContext,
  input: QuestionUpdateInput,
) {
  const [updated] = await ctx.db
    .update(QuestionsTable)
    .set({
      text: input.text,
      description: input.description || null,
      type: input.type,
      points: input.points,
      isRequired: input.isRequired,
      imageUrl: input.imageUrl || null,
      imageAlt: input.imageAlt || null,
    })
    .where(
      and(
        eq(QuestionsTable.id, input.id),
        eq(QuestionsTable.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: QuestionsTable.id });

  if (!updated) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { updated: true };
}

// Hard delete — `answers` carries an `onDelete: "cascade"` FK back to
// `questions`, so removing a question cleans up its answer choices too.
export async function deleteQuestion(
  ctx: OrgTRPCContext,
  input: QuestionDeleteInput,
) {
  const [deleted] = await ctx.db
    .delete(QuestionsTable)
    .where(
      and(
        eq(QuestionsTable.id, input.id),
        eq(QuestionsTable.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: QuestionsTable.id });

  if (!deleted) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { deleted: true };
}

// Moves the question among *all* of the section's items — its neighbour may be
// a content block, since the two share one order sequence.
export async function moveQuestion(
  ctx: OrgTRPCContext,
  input: QuestionMoveInput,
) {
  return moveSectionItem(ctx, { ...input, kind: "question" });
}
