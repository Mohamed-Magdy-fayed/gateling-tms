import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, gt, isNull, lt } from "drizzle-orm";
import { CoursesTable, LevelsTable } from "@/drizzle/schema";
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
  return ctx.db.transaction(async (trx) => {
    // Locks the course row for the rest of the transaction so two concurrent
    // creates against the same course can't both observe the same `order`
    // count and insert duplicates — same pattern as
    // organizations/server/mutations.ts's lockAdminRowsForUpdate (STATE.md
    // D49) and courses/server/mutations.ts's createCourse. Also re-verifies
    // the course is still active (STATE.md D59).
    const [course] = await trx
      .select({ id: CoursesTable.id })
      .from(CoursesTable)
      .where(
        and(
          eq(CoursesTable.id, input.courseId),
          eq(CoursesTable.organizationId, ctx.organizationId),
          isNull(CoursesTable.deletedAt),
        ),
      )
      .for("update");

    if (!course) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    const [{ value: existingCount }] = await trx
      .select({ value: count() })
      .from(LevelsTable)
      .where(eq(LevelsTable.courseId, input.courseId));

    const [level] = await trx
      .insert(LevelsTable)
      .values({
        organizationId: ctx.organizationId,
        courseId: input.courseId,
        name: input.name,
        order: Number(existingCount),
      })
      .returning({ id: LevelsTable.id });

    return { id: level.id };
  });
}

// update/delete/move all resolve the level's courseId first and re-check it
// through assertCourseInOrg — a level's parent course can be soft-deleted
// after the level was created, and create/list already enforce that
// boundary, so these must too (STATE.md D59).
export async function updateLevel(
  ctx: OrgTRPCContext,
  input: LevelUpdateInput,
) {
  const level = await ctx.db.query.LevelsTable.findFirst({
    where: and(
      eq(LevelsTable.id, input.id),
      eq(LevelsTable.organizationId, ctx.organizationId),
    ),
    columns: { id: true, courseId: true },
  });

  if (!level) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  await assertCourseInOrg(ctx, level.courseId);

  await ctx.db
    .update(LevelsTable)
    .set({ name: input.name })
    .where(eq(LevelsTable.id, level.id));

  return { updated: true };
}

export async function deleteLevel(
  ctx: OrgTRPCContext,
  input: LevelDeleteInput,
) {
  const level = await ctx.db.query.LevelsTable.findFirst({
    where: and(
      eq(LevelsTable.id, input.id),
      eq(LevelsTable.organizationId, ctx.organizationId),
    ),
    columns: { id: true, courseId: true },
  });

  if (!level) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  await assertCourseInOrg(ctx, level.courseId);

  await ctx.db.delete(LevelsTable).where(eq(LevelsTable.id, level.id));

  return { deleted: true };
}

// Swaps `order` with the adjacent sibling in the same course rather than
// renumbering the whole list — cheap, and correct even when prior deletes
// left duplicate/non-contiguous order values (ties break on `id`, see
// queries.ts's listLevels ordering). Locking the course row also serializes
// this against createLevel's order allocation for the same course, and
// re-verifies the parent course is still active.
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

    const [course] = await trx
      .select({ id: CoursesTable.id })
      .from(CoursesTable)
      .where(
        and(
          eq(CoursesTable.id, current.courseId),
          eq(CoursesTable.organizationId, ctx.organizationId),
          isNull(CoursesTable.deletedAt),
        ),
      )
      .for("update");

    if (!course) {
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
