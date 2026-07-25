import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import {
  FormResponsesTable,
  FormSectionsTable,
  FormsTable,
  UsersTable,
} from "@/drizzle/schema";
import type { ScorableQuestion } from "./scoring";
import type { OrgTRPCContext } from "./types";

/** Confirms the form exists and belongs to the caller's org. */
export async function assertFormInOrg(ctx: OrgTRPCContext, formId: string) {
  const form = await ctx.db.query.FormsTable.findFirst({
    where: and(
      eq(FormsTable.id, formId),
      eq(FormsTable.organizationId, ctx.organizationId),
    ),
    columns: { id: true, status: true },
  });

  if (!form) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return form;
}

/** Flattened question+answer tree for a form, shaped for `scoreFormResponse`. */
export async function getScorableQuestions(
  ctx: OrgTRPCContext,
  formId: string,
): Promise<ScorableQuestion[]> {
  const sections = await ctx.db.query.FormSectionsTable.findMany({
    where: and(
      eq(FormSectionsTable.formId, formId),
      eq(FormSectionsTable.organizationId, ctx.organizationId),
    ),
    with: {
      questions: {
        with: {
          answers: { columns: { id: true, isCorrect: true } },
        },
      },
    },
  });

  return sections.flatMap((section) =>
    section.questions.map((question) => ({
      id: question.id,
      type: question.type,
      points: question.points,
      answers: question.answers,
    })),
  );
}

export async function listResponses(ctx: OrgTRPCContext, formId: string) {
  await assertFormInOrg(ctx, formId);

  return ctx.db
    .select({
      id: FormResponsesTable.id,
      formId: FormResponsesTable.formId,
      answers: FormResponsesTable.answers,
      score: FormResponsesTable.score,
      submittedAt: FormResponsesTable.submittedAt,
      respondent: {
        id: UsersTable.id,
        name: UsersTable.name,
        email: UsersTable.email,
      },
    })
    .from(FormResponsesTable)
    .innerJoin(
      UsersTable,
      eq(UsersTable.id, FormResponsesTable.respondentUserId),
    )
    .where(
      and(
        eq(FormResponsesTable.formId, formId),
        eq(FormResponsesTable.organizationId, ctx.organizationId),
      ),
    )
    .orderBy(desc(FormResponsesTable.submittedAt));
}
