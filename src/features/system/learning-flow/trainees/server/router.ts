import {
  createTRPCRouter,
  orgContentManagerProcedure,
  orgProcedure,
} from "@/integrations/trpc/init";
import { createTrainee, deleteTrainee, updateTrainee } from "./mutations";
import { getTrainee, listTraineeGroups, listTrainees } from "./queries";
import {
  listTraineesInput,
  traineeDeleteSchema,
  traineeMutationSchema,
  traineeUpdateSchema,
} from "./schemas";

export const traineesRouter = createTRPCRouter({
  list: orgProcedure
    .input(listTraineesInput)
    .query(async ({ ctx, input }) => listTrainees(ctx, input)),
  // Reuses traineeDeleteSchema — same {id} shape, no need for a near-duplicate.
  get: orgProcedure
    .input(traineeDeleteSchema)
    .query(async ({ ctx, input }) => getTrainee(ctx, input.id)),
  groups: orgProcedure
    .input(traineeDeleteSchema)
    .query(async ({ ctx, input }) => listTraineeGroups(ctx, input.id)),
  create: orgContentManagerProcedure
    .input(traineeMutationSchema)
    .mutation(async ({ ctx, input }) => createTrainee(ctx, input)),
  update: orgContentManagerProcedure
    .input(traineeUpdateSchema)
    .mutation(async ({ ctx, input }) => updateTrainee(ctx, input)),
  delete: orgContentManagerProcedure
    .input(traineeDeleteSchema)
    .mutation(async ({ ctx, input }) => deleteTrainee(ctx, input)),
});
