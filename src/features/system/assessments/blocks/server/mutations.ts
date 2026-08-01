import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { FormBlocksTable } from "@/drizzle/schema";
import {
  lockSection,
  moveSectionItem,
  nextItemOrder,
} from "@/features/system/assessments/sections/server/reorder";
import type {
  BlockDeleteInput,
  BlockMoveInput,
  BlockMutationInput,
  BlockUpdateInput,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

/**
 * A text block keeps no media and a media block keeps no body, whatever the
 * dialog happened to have in its other fields when it was submitted. The
 * schema allows the intermediate state so switching kinds doesn't wipe what
 * was typed; this is where the block settles into one shape.
 */
function contentForKind(input: {
  kind: BlockMutationInput["kind"];
  title: string;
  body: string;
  mediaUrl: string;
  mediaAlt: string;
}) {
  const isText = input.kind === "text";

  return {
    kind: input.kind,
    title: input.title || null,
    body: isText ? input.body || null : null,
    mediaUrl: isText ? null : input.mediaUrl || null,
    mediaAlt: isText ? null : input.mediaAlt || null,
    // A hand-authored block's media is already where it will live; only an
    // import leaves a pending source behind, and editing settles it.
    sourceUrl: null,
  };
}

export async function createBlock(
  ctx: OrgTRPCContext,
  input: BlockMutationInput,
) {
  return ctx.db.transaction(async (trx) => {
    // The order sequence is shared with the section's questions — see
    // `sections/server/reorder.ts`.
    if (!(await lockSection(trx, ctx.organizationId, input.sectionId))) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    const [block] = await trx
      .insert(FormBlocksTable)
      .values({
        organizationId: ctx.organizationId,
        sectionId: input.sectionId,
        ...contentForKind(input),
        order: await nextItemOrder(trx, input.sectionId),
      })
      .returning({ id: FormBlocksTable.id });

    return { id: block.id };
  });
}

export async function updateBlock(
  ctx: OrgTRPCContext,
  input: BlockUpdateInput,
) {
  const [updated] = await ctx.db
    .update(FormBlocksTable)
    .set(contentForKind(input))
    .where(
      and(
        eq(FormBlocksTable.id, input.id),
        eq(FormBlocksTable.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: FormBlocksTable.id });

  if (!updated) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { updated: true };
}

/**
 * Hard delete. The stored image is deliberately left in Firebase rather than
 * removed here: the same URL can have been reused on another block or a
 * lecture, and the nightly usage reconciliation already recomputes
 * `organizations.storageBytes` from the bucket itself.
 */
export async function deleteBlock(
  ctx: OrgTRPCContext,
  input: BlockDeleteInput,
) {
  const [deleted] = await ctx.db
    .delete(FormBlocksTable)
    .where(
      and(
        eq(FormBlocksTable.id, input.id),
        eq(FormBlocksTable.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: FormBlocksTable.id });

  if (!deleted) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { deleted: true };
}

// Moves the block among *all* of the section's items — its neighbour may be a
// question, since the two share one order sequence.
export async function moveBlock(ctx: OrgTRPCContext, input: BlockMoveInput) {
  return moveSectionItem(ctx, { ...input, kind: "block" });
}
