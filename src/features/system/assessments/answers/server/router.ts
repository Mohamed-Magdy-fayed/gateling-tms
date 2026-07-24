import {
  createTRPCRouter,
  orgContentManagerProcedure,
  orgProcedure,
} from "@/integrations/trpc/init";
import {
  createAnswer,
  deleteAnswer,
  moveAnswer,
  updateAnswer,
} from "./mutations";
import { listAnswers } from "./queries";
import {
  answerDeleteSchema,
  answerMoveSchema,
  answerMutationSchema,
  answerUpdateSchema,
  listAnswersInput,
} from "./schemas";

export const answersRouter = createTRPCRouter({
  list: orgProcedure
    .input(listAnswersInput)
    .query(async ({ ctx, input }) => listAnswers(ctx, input)),
  create: orgContentManagerProcedure
    .input(answerMutationSchema)
    .mutation(async ({ ctx, input }) => createAnswer(ctx, input)),
  update: orgContentManagerProcedure
    .input(answerUpdateSchema)
    .mutation(async ({ ctx, input }) => updateAnswer(ctx, input)),
  delete: orgContentManagerProcedure
    .input(answerDeleteSchema)
    .mutation(async ({ ctx, input }) => deleteAnswer(ctx, input)),
  move: orgContentManagerProcedure
    .input(answerMoveSchema)
    .mutation(async ({ ctx, input }) => moveAnswer(ctx, input)),
});
