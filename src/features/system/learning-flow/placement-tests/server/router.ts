import {
  createTRPCRouter,
  orgContentManagerProcedure,
} from "@/integrations/trpc/init";
import {
  cancelPlacementTest,
  createPlacementTest,
  deletePlacementTest,
  recordPlacementAttempt,
  reviewPlacementTest,
} from "./mutations";
import { getPlacementTest, listPlacementTests } from "./queries";
import {
  listPlacementTestsInput,
  placementTestAttemptSchema,
  placementTestDeleteSchema,
  placementTestMutationSchema,
  placementTestReviewSchema,
} from "./schemas";

/**
 * Every route is admin/teacher-only, reads included: a placement test carries
 * the trainee's result and the reviewer's private feedback, which a `student`
 * membership must not be able to read for the whole roster (STATE.md D75(1),
 * D83(1)).
 */
export const placementTestsRouter = createTRPCRouter({
  list: orgContentManagerProcedure
    .input(listPlacementTestsInput)
    .query(async ({ ctx, input }) => listPlacementTests(ctx, input.traineeId)),
  get: orgContentManagerProcedure
    .input(placementTestDeleteSchema)
    .query(async ({ ctx, input }) => getPlacementTest(ctx, input.id)),
  create: orgContentManagerProcedure
    .input(placementTestMutationSchema)
    .mutation(async ({ ctx, input }) => createPlacementTest(ctx, input)),
  recordAttempt: orgContentManagerProcedure
    .input(placementTestAttemptSchema)
    .mutation(async ({ ctx, input }) => recordPlacementAttempt(ctx, input)),
  review: orgContentManagerProcedure
    .input(placementTestReviewSchema)
    .mutation(async ({ ctx, input }) => reviewPlacementTest(ctx, input)),
  cancel: orgContentManagerProcedure
    .input(placementTestDeleteSchema)
    .mutation(async ({ ctx, input }) => cancelPlacementTest(ctx, input)),
  delete: orgContentManagerProcedure
    .input(placementTestDeleteSchema)
    .mutation(async ({ ctx, input }) => deletePlacementTest(ctx, input)),
});
