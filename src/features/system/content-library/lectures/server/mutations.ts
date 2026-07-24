import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, gt, lt } from "drizzle-orm";
import { LecturesTable } from "@/drizzle/schema";
import { assertLevelInOrg } from "./queries";
import type {
  LectureDeleteInput,
  LectureMoveInput,
  LectureMutationInput,
  LectureUpdateInput,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

export async function createLecture(
  ctx: OrgTRPCContext,
  input: LectureMutationInput,
) {
  await assertLevelInOrg(ctx, input.levelId);

  const [{ value: existingCount }] = await ctx.db
    .select({ value: count() })
    .from(LecturesTable)
    .where(eq(LecturesTable.levelId, input.levelId));

  const [lecture] = await ctx.db
    .insert(LecturesTable)
    .values({
      organizationId: ctx.organizationId,
      levelId: input.levelId,
      name: input.name,
      description: input.description || null,
      content: input.content || null,
      order: Number(existingCount),
    })
    .returning({ id: LecturesTable.id });

  return { id: lecture.id };
}

export async function updateLecture(
  ctx: OrgTRPCContext,
  input: LectureUpdateInput,
) {
  const [updated] = await ctx.db
    .update(LecturesTable)
    .set({
      name: input.name,
      description: input.description || null,
      content: input.content || null,
    })
    .where(
      and(
        eq(LecturesTable.id, input.id),
        eq(LecturesTable.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: LecturesTable.id });

  if (!updated) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { updated: true };
}

export async function deleteLecture(
  ctx: OrgTRPCContext,
  input: LectureDeleteInput,
) {
  const [deleted] = await ctx.db
    .delete(LecturesTable)
    .where(
      and(
        eq(LecturesTable.id, input.id),
        eq(LecturesTable.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: LecturesTable.id });

  if (!deleted) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { deleted: true };
}

// Swaps `order` with the adjacent sibling in the same level rather than
// renumbering the whole list — same reasoning as levels/server/mutations.ts's
// moveLevel.
export async function moveLecture(
  ctx: OrgTRPCContext,
  input: LectureMoveInput,
) {
  return ctx.db.transaction(async (trx) => {
    const current = await trx.query.LecturesTable.findFirst({
      where: and(
        eq(LecturesTable.id, input.id),
        eq(LecturesTable.organizationId, ctx.organizationId),
      ),
      columns: { id: true, levelId: true, order: true },
    });

    if (!current) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    const neighbor = await trx.query.LecturesTable.findFirst({
      where: and(
        eq(LecturesTable.levelId, current.levelId),
        eq(LecturesTable.organizationId, ctx.organizationId),
        input.direction === "up"
          ? lt(LecturesTable.order, current.order)
          : gt(LecturesTable.order, current.order),
      ),
      orderBy:
        input.direction === "up"
          ? desc(LecturesTable.order)
          : asc(LecturesTable.order),
      columns: { id: true, order: true },
    });

    // Already first/last — nothing to swap with, not an error.
    if (!neighbor) return { moved: false };

    await trx
      .update(LecturesTable)
      .set({ order: neighbor.order })
      .where(eq(LecturesTable.id, current.id));
    await trx
      .update(LecturesTable)
      .set({ order: current.order })
      .where(eq(LecturesTable.id, neighbor.id));

    return { moved: true };
  });
}
