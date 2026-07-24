import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, gt, lt } from "drizzle-orm";
import { FormSectionsTable, QuestionsTable } from "@/drizzle/schema";
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
    // Locks the section row for the rest of the transaction so two
    // concurrent creates against the same section can't both observe the
    // same `order` count and insert duplicates — same pattern as
    // sections/server/mutations.ts's createSection.
    const [section] = await trx
      .select({ id: FormSectionsTable.id })
      .from(FormSectionsTable)
      .where(
        and(
          eq(FormSectionsTable.id, input.sectionId),
          eq(FormSectionsTable.organizationId, ctx.organizationId),
        ),
      )
      .for("update");

    if (!section) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    const [{ value: existingCount }] = await trx
      .select({ value: count() })
      .from(QuestionsTable)
      .where(eq(QuestionsTable.sectionId, input.sectionId));

    const [question] = await trx
      .insert(QuestionsTable)
      .values({
        organizationId: ctx.organizationId,
        sectionId: input.sectionId,
        text: input.text,
        type: input.type,
        points: input.points,
        order: Number(existingCount),
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
    .set({ text: input.text, type: input.type, points: input.points })
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

// Swaps `order` with the adjacent sibling in the same section rather than
// renumbering the whole list — same reasoning as sections/server/mutations.ts's
// moveSection. Locking the section row also serializes this against
// createQuestion's order allocation for the same section.
export async function moveQuestion(
  ctx: OrgTRPCContext,
  input: QuestionMoveInput,
) {
  return ctx.db.transaction(async (trx) => {
    const current = await trx.query.QuestionsTable.findFirst({
      where: and(
        eq(QuestionsTable.id, input.id),
        eq(QuestionsTable.organizationId, ctx.organizationId),
      ),
      columns: { id: true, sectionId: true, order: true },
    });

    if (!current) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    const [section] = await trx
      .select({ id: FormSectionsTable.id })
      .from(FormSectionsTable)
      .where(
        and(
          eq(FormSectionsTable.id, current.sectionId),
          eq(FormSectionsTable.organizationId, ctx.organizationId),
        ),
      )
      .for("update");

    if (!section) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    const neighbor = await trx.query.QuestionsTable.findFirst({
      where: and(
        eq(QuestionsTable.sectionId, current.sectionId),
        eq(QuestionsTable.organizationId, ctx.organizationId),
        input.direction === "up"
          ? lt(QuestionsTable.order, current.order)
          : gt(QuestionsTable.order, current.order),
      ),
      orderBy:
        input.direction === "up"
          ? desc(QuestionsTable.order)
          : asc(QuestionsTable.order),
      columns: { id: true, order: true },
    });

    // Already first/last — nothing to swap with, not an error.
    if (!neighbor) return { moved: false };

    await trx
      .update(QuestionsTable)
      .set({ order: neighbor.order })
      .where(eq(QuestionsTable.id, current.id));
    await trx
      .update(QuestionsTable)
      .set({ order: current.order })
      .where(eq(QuestionsTable.id, neighbor.id));

    return { moved: true };
  });
}
