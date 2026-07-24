import {
  createTRPCRouter,
  orgContentManagerProcedure,
  orgProcedure,
} from "@/integrations/trpc/init";
import {
  createQuestion,
  deleteQuestion,
  moveQuestion,
  updateQuestion,
} from "./mutations";
import { listQuestions } from "./queries";
import {
  listQuestionsInput,
  questionDeleteSchema,
  questionMoveSchema,
  questionMutationSchema,
  questionUpdateSchema,
} from "./schemas";

export const questionsRouter = createTRPCRouter({
  list: orgProcedure
    .input(listQuestionsInput)
    .query(async ({ ctx, input }) => listQuestions(ctx, input)),
  create: orgContentManagerProcedure
    .input(questionMutationSchema)
    .mutation(async ({ ctx, input }) => createQuestion(ctx, input)),
  update: orgContentManagerProcedure
    .input(questionUpdateSchema)
    .mutation(async ({ ctx, input }) => updateQuestion(ctx, input)),
  delete: orgContentManagerProcedure
    .input(questionDeleteSchema)
    .mutation(async ({ ctx, input }) => deleteQuestion(ctx, input)),
  move: orgContentManagerProcedure
    .input(questionMoveSchema)
    .mutation(async ({ ctx, input }) => moveQuestion(ctx, input)),
});
