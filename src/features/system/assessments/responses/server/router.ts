import {
  createTRPCRouter,
  orgContentManagerProcedure,
  orgProcedure,
} from "@/integrations/trpc/init";
import { gradeResponse, submitResponse } from "./mutations";
import { getGradingSheet, listResponses } from "./queries";
import {
  gradeResponseSchema,
  gradingSheetInput,
  listResponsesInput,
  submitResponseSchema,
} from "./schemas";

export const responsesRouter = createTRPCRouter({
  // Any org member can submit — students take assessments, admins/teachers
  // use this same path to preview/test a form before publishing it widely.
  submit: orgProcedure
    .input(submitResponseSchema)
    .mutation(async ({ ctx, input }) => submitResponse(ctx, input)),
  // Listing every respondent's answers is an authoring/grading action —
  // students shouldn't see the whole class's submissions.
  list: orgContentManagerProcedure
    .input(listResponsesInput)
    .query(async ({ ctx, input }) => listResponses(ctx, input.formId)),
  // Carries the accepted wordings, so it stays behind the same staff gate as
  // `list` — a student membership must never be able to read it.
  gradingSheet: orgContentManagerProcedure
    .input(gradingSheetInput)
    .query(async ({ ctx, input }) => getGradingSheet(ctx, input.responseId)),
  grade: orgContentManagerProcedure
    .input(gradeResponseSchema)
    .mutation(async ({ ctx, input }) => gradeResponse(ctx, input)),
});
