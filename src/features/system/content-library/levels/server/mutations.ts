import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, gt, lt } from "drizzle-orm";
import { LevelsTable } from "@/drizzle/schema";
import { assertCourseInOrg } from "./queries";
import type {
  LevelDeleteInput,
  LevelMoveInput,
  LevelMutationInput,
  LevelUpdateInput,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

export async function createLevel(
  ctx: OrgTRPCContext,
  input: LevelMutationInput,
) {
  await assertCourseInOrg(ctx, input.courseId);

  const [{ value: existingCount }] = await ctx.db
    .select({ value: count() })
    .from(LevelsTable)
    .where(eq(LevelsTable.courseId, input.courseId));

  const [level] = await ctx.db
    .insert(LevelsTable)
    .values({
      organizationId: ctx.organizationId,
      courseId: input.courseId,
      name: input.name,
      order: Number(existingCount),
    })
    .returning({ id: LevelsTable.id });

  return { id: level.id };
}

export async function updateLevel(
  ctx: OrgTRPCContext,
  input: LevelUpdateInput,
) {
  const [updated] = await ctx.db
    .update(LevelsTable)
    .set({ name: input.name })
    .where(
      and(
        eq(LevelsTable.id, input.id),
        eq(LevelsTable.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: LevelsTable.id });

  if (!updated) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { updated: true };
}

export async function deleteLevel(
  ctx: OrgTRPCContext,
  input: LevelDeleteInput,
) {
  const [deleted] = await ctx.db
    .delete(LevelsTable)
    .where(
      and(
        eq(LevelsTable.id, input.id),
        eq(LevelsTable.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: LevelsTable.id });

  if (!deleted) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { deleted: true };
}

// Swaps `order` with the adjacent sibling in the same course rather than
// renumbering the whole list — cheap, and correct even when prior deletes
// left duplicate/non-contiguous order values (ties break on `id`, see
// queries.ts's listLevels ordering).
export async function moveLevel(ctx: OrgTRPCContext, input: LevelMoveInput) {
  return ctx.db.transaction(async (trx) => {
    const current = await trx.query.LevelsTable.findFirst({
      where: and(
        eq(LevelsTable.id, input.id),
        eq(LevelsTable.organizationId, ctx.organizationId),
      ),
      columns: { id: true, courseId: true, order: true },
    });

    if (!current) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    const neighbor = await trx.query.LevelsTable.findFirst({
      where: and(
        eq(LevelsTable.courseId, current.courseId),
        eq(LevelsTable.organizationId, ctx.organizationId),
        input.direction === "up"
          ? lt(LevelsTable.order, current.order)
          : gt(LevelsTable.order, current.order),
      ),
      orderBy:
        input.direction === "up"
          ? desc(LevelsTable.order)
          : asc(LevelsTable.order),
      columns: { id: true, order: true },
    });

    // Already first/last — nothing to swap with, not an error.
    if (!neighbor) return { moved: false };

    await trx
      .update(LevelsTable)
      .set({ order: neighbor.order })
      .where(eq(LevelsTable.id, current.id));
    await trx
      .update(LevelsTable)
      .set({ order: current.order })
      .where(eq(LevelsTable.id, neighbor.id));

    return { moved: true };
  });
}
