import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { FormSectionsTable, FormsTable } from "@/drizzle/schema";
import type { ListSectionsInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

/** Confirms the form exists and belongs to the caller's org — every section mutation scopes through this first so a section can never be attached to (or read from) another org's form. */
export async function assertFormInOrg(ctx: OrgTRPCContext, formId: string) {
  const form = await ctx.db.query.FormsTable.findFirst({
    where: and(
      eq(FormsTable.id, formId),
      eq(FormsTable.organizationId, ctx.organizationId),
    ),
    columns: { id: true },
  });

  if (!form) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return form;
}

export async function listSections(
  ctx: OrgTRPCContext,
  input: ListSectionsInput,
) {
  await assertFormInOrg(ctx, input.formId);

  return ctx.db
    .select()
    .from(FormSectionsTable)
    .where(
      and(
        eq(FormSectionsTable.formId, input.formId),
        eq(FormSectionsTable.organizationId, ctx.organizationId),
      ),
    )
    .orderBy(asc(FormSectionsTable.order), asc(FormSectionsTable.id));
}
