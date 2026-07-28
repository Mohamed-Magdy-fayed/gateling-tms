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

/**
 * Admin/teacher-only throughout, reads included: a trainee row carries the
 * student's email and phone, so `list` hands the whole organization's contact
 * details to whoever calls it. That is the same leak `responses.list` had
 * (STATE.md D75(1)) and `groups.students` had (D83(1)) — this router just
 * predates both fixes.
 *
 * A future student-facing view needs a query scoped to the caller's own
 * trainee record rather than a widening of these.
 *
 * `groups` is the exception and stays open: it returns group names and
 * statuses for one trainee, no contact details.
 */
export const traineesRouter = createTRPCRouter({
  list: orgContentManagerProcedure
    .input(listTraineesInput)
    .query(async ({ ctx, input }) => listTrainees(ctx, input)),
  // Reuses traineeDeleteSchema — same {id} shape, no need for a near-duplicate.
  get: orgContentManagerProcedure
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
