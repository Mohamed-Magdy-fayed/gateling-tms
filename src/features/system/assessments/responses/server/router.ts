import {
  createTRPCRouter,
  orgContentManagerProcedure,
  orgProcedure,
} from "@/integrations/trpc/init";
import { submitResponse } from "./mutations";
import { listResponses } from "./queries";
import { listResponsesInput, submitResponseSchema } from "./schemas";

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
});
