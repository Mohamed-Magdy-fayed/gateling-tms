import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { AnswersTable, QuestionsTable } from "@/drizzle/schema";
import type { ListAnswersInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

/** Confirms the question exists and belongs to the caller's org — every answer mutation scopes through this first so an answer can never be attached to (or read from) another org's question. */
export async function assertQuestionInOrg(
  ctx: OrgTRPCContext,
  questionId: string,
) {
  const question = await ctx.db.query.QuestionsTable.findFirst({
    where: and(
      eq(QuestionsTable.id, questionId),
      eq(QuestionsTable.organizationId, ctx.organizationId),
    ),
    columns: { id: true },
  });

  if (!question) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return question;
}

export async function listAnswers(
  ctx: OrgTRPCContext,
  input: ListAnswersInput,
) {
  await assertQuestionInOrg(ctx, input.questionId);

  return ctx.db
    .select()
    .from(AnswersTable)
    .where(
      and(
        eq(AnswersTable.questionId, input.questionId),
        eq(AnswersTable.organizationId, ctx.organizationId),
      ),
    )
    .orderBy(asc(AnswersTable.order), asc(AnswersTable.id));
}
