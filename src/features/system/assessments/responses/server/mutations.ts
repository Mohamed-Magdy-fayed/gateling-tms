import { TRPCError } from "@trpc/server";
import { FormResponsesTable } from "@/drizzle/schema";
import { assertFormInOrg, getScorableQuestions } from "./queries";
import type { SubmitResponseInput } from "./schemas";
import { scoreFormResponse } from "./scoring";
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
  const score = scoreFormResponse(questions, input.answers);

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
