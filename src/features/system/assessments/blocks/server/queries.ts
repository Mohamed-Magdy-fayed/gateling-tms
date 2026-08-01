import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { FormBlocksTable, FormSectionsTable } from "@/drizzle/schema";
import type { ListBlocksInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

/**
 * Confirms the section exists and belongs to the caller's org — every block
 * mutation scopes through this first, so a block can never be attached to (or
 * read from) another org's section.
 */
async function assertSectionInOrg(ctx: OrgTRPCContext, sectionId: string) {
  const section = await ctx.db.query.FormSectionsTable.findFirst({
    where: and(
      eq(FormSectionsTable.id, sectionId),
      eq(FormSectionsTable.organizationId, ctx.organizationId),
    ),
    columns: { id: true },
  });

  if (!section) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return section;
}

export async function listBlocks(ctx: OrgTRPCContext, input: ListBlocksInput) {
  await assertSectionInOrg(ctx, input.sectionId);

  return ctx.db
    .select()
    .from(FormBlocksTable)
    .where(
      and(
        eq(FormBlocksTable.sectionId, input.sectionId),
        eq(FormBlocksTable.organizationId, ctx.organizationId),
      ),
    )
    .orderBy(asc(FormBlocksTable.order), asc(FormBlocksTable.id));
}
