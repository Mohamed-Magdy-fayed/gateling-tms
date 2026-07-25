import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gt, lt, sql } from "drizzle-orm";
import { FormSectionsTable, FormsTable } from "@/drizzle/schema";
import type {
  SectionDeleteInput,
  SectionMoveInput,
  SectionMutationInput,
  SectionUpdateInput,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

export async function createSection(
  ctx: OrgTRPCContext,
  input: SectionMutationInput,
) {
  return ctx.db.transaction(async (trx) => {
    // Locks the form row for the rest of the transaction so two concurrent
    // creates against the same form can't both observe the same `order`
    // count and insert duplicates — same pattern as
    // content-library/levels/server/mutations.ts's createLevel.
    const [form] = await trx
      .select({ id: FormsTable.id })
      .from(FormsTable)
      .where(
        and(
          eq(FormsTable.id, input.formId),
          eq(FormsTable.organizationId, ctx.organizationId),
        ),
      )
      .for("update");

    if (!form) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    // `max(order) + 1` rather than `count()` — deleting a section never
    // renumbers its surviving siblings, so a plain count of remaining rows
    // can collide with an order value a surviving row already holds (e.g.
    // orders 0,1,2 → delete order 1 → count is 2 → a new row would get
    // order 2 again, duplicating the existing one).
    const [{ value: maxOrder }] = await trx
      .select({
        value: sql<number>`coalesce(max(${FormSectionsTable.order}), -1)`,
      })
      .from(FormSectionsTable)
      .where(eq(FormSectionsTable.formId, input.formId));

    const [section] = await trx
      .insert(FormSectionsTable)
      .values({
        organizationId: ctx.organizationId,
        formId: input.formId,
        title: input.title,
        order: Number(maxOrder) + 1,
      })
      .returning({ id: FormSectionsTable.id });

    return { id: section.id };
  });
}

export async function updateSection(
  ctx: OrgTRPCContext,
  input: SectionUpdateInput,
) {
  const [updated] = await ctx.db
    .update(FormSectionsTable)
    .set({ title: input.title })
    .where(
      and(
        eq(FormSectionsTable.id, input.id),
        eq(FormSectionsTable.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: FormSectionsTable.id });

  if (!updated) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { updated: true };
}

// Hard delete — `questions` carries an `onDelete: "cascade"` FK back to
// `form_sections` (and `answers` cascades transitively from there), so
// removing a section cleans up its whole question/answer subtree.
export async function deleteSection(
  ctx: OrgTRPCContext,
  input: SectionDeleteInput,
) {
  const [deleted] = await ctx.db
    .delete(FormSectionsTable)
    .where(
      and(
        eq(FormSectionsTable.id, input.id),
        eq(FormSectionsTable.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: FormSectionsTable.id });

  if (!deleted) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { deleted: true };
}

// Swaps `order` with the adjacent sibling in the same form rather than
// renumbering the whole list — same reasoning as levels/server/mutations.ts's
// moveLevel. Locking the form row also serializes this against
// createSection's order allocation for the same form.
export async function moveSection(
  ctx: OrgTRPCContext,
  input: SectionMoveInput,
) {
  return ctx.db.transaction(async (trx) => {
    // Only resolves which form to lock — its `order` isn't trusted yet,
    // since a concurrent move on this exact section could still land
    // between this read and the lock below.
    const pre = await trx.query.FormSectionsTable.findFirst({
      where: and(
        eq(FormSectionsTable.id, input.id),
        eq(FormSectionsTable.organizationId, ctx.organizationId),
      ),
      columns: { formId: true },
    });

    if (!pre) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    const [form] = await trx
      .select({ id: FormsTable.id })
      .from(FormsTable)
      .where(
        and(
          eq(FormsTable.id, pre.formId),
          eq(FormsTable.organizationId, ctx.organizationId),
        ),
      )
      .for("update");

    if (!form) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    // Re-read now that the form row is locked, so `current.order` is
    // authoritative — a concurrent move could have changed it between the
    // pre-lock read above and this point.
    const current = await trx.query.FormSectionsTable.findFirst({
      where: and(
        eq(FormSectionsTable.id, input.id),
        eq(FormSectionsTable.organizationId, ctx.organizationId),
      ),
      columns: { id: true, formId: true, order: true },
    });

    if (!current) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    const neighbor = await trx.query.FormSectionsTable.findFirst({
      where: and(
        eq(FormSectionsTable.formId, current.formId),
        eq(FormSectionsTable.organizationId, ctx.organizationId),
        input.direction === "up"
          ? lt(FormSectionsTable.order, current.order)
          : gt(FormSectionsTable.order, current.order),
      ),
      orderBy:
        input.direction === "up"
          ? desc(FormSectionsTable.order)
          : asc(FormSectionsTable.order),
      columns: { id: true, order: true },
    });

    // Already first/last — nothing to swap with, not an error.
    if (!neighbor) return { moved: false };

    await trx
      .update(FormSectionsTable)
      .set({ order: neighbor.order })
      .where(eq(FormSectionsTable.id, current.id));
    await trx
      .update(FormSectionsTable)
      .set({ order: current.order })
      .where(eq(FormSectionsTable.id, neighbor.id));

    return { moved: true };
  });
}
