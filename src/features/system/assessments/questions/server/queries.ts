import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { FormSectionsTable, QuestionsTable } from "@/drizzle/schema";
import type { ListQuestionsInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

/** Confirms the section exists and belongs to the caller's org — every question mutation scopes through this first so a question can never be attached to (or read from) another org's section. */
export async function assertSectionInOrg(
  ctx: OrgTRPCContext,
  sectionId: string,
) {
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

export async function listQuestions(
  ctx: OrgTRPCContext,
  input: ListQuestionsInput,
) {
  await assertSectionInOrg(ctx, input.sectionId);

  return ctx.db
    .select()
    .from(QuestionsTable)
    .where(
      and(
        eq(QuestionsTable.sectionId, input.sectionId),
        eq(QuestionsTable.organizationId, ctx.organizationId),
      ),
    )
    .orderBy(asc(QuestionsTable.order), asc(QuestionsTable.id));
}
