import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { FormResponsesTable } from "@/drizzle/schema";
import { gradeFormResponse } from "./grading";
import {
  assertFormInOrg,
  getResponseInOrg,
  getScorableQuestions,
} from "./queries";
import type { GradeResponseInput, SubmitResponseInput } from "./schemas";
import { sumQuestionPoints } from "./scoring";
import type { OrgTRPCContext } from "./types";

// No "already submitted" guard (unlike SOURCE's allowMultipleResponses
// check) — this phase's submit path is an admin/teacher preview-and-test
// tool, not the real student-facing flow (that's Phase 5, per phase-04.md
// step 6's "full student-facing flow matures in Phase 5"). Revisit once
// Phase 5 defines actual submission-attempt rules.
export async function submitResponse(
  ctx: OrgTRPCContext,
  input: SubmitResponseInput,
) {
  const session = ctx.session;
  if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });

  const form = await assertFormInOrg(ctx, input.formId);

  if (form.status !== "published") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: ctx.t("responses.notPublished"),
    });
  }

  const questions = await getScorableQuestions(ctx, input.formId);
  const score = await gradeFormResponse(questions, input.answers);

  const [response] = await ctx.db
    .insert(FormResponsesTable)
    .values({
      organizationId: ctx.organizationId,
      formId: input.formId,
      respondentUserId: session.user.id,
      answers: input.answers,
      score,
    })
    .returning({ id: FormResponsesTable.id });

  return { id: response.id, score };
}

/**
 * Records a grader's own score for a response.
 *
 * The automatic pass leaves a response ungraded rather than guessing (a short
 * answer with no accepted wordings, or one no model verdict came back for), and
 * this is how that response stops being stuck. Nothing re-scores a submitted
 * response, so a manual score is never overwritten later.
 */
export async function gradeResponse(
  ctx: OrgTRPCContext,
  input: GradeResponseInput,
) {
  const response = await getResponseInOrg(ctx, input.responseId);
  const questions = await getScorableQuestions(ctx, response.formId);
  const maxScore = sumQuestionPoints(questions);

  if (input.score > maxScore) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: ctx.t("responses.scoreAboveMax", { max: maxScore }),
    });
  }

  await ctx.db
    .update(FormResponsesTable)
    .set({ score: input.score })
    .where(
      and(
        eq(FormResponsesTable.id, response.id),
        eq(FormResponsesTable.organizationId, ctx.organizationId),
      ),
    );

  return { id: response.id, score: input.score };
}
