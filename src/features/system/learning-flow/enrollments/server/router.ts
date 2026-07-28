import {
  createTRPCRouter,
  orgContentManagerProcedure,
  orgProcedure,
} from "@/integrations/trpc/init";
import {
  createEnrollment,
  deleteEnrollment,
  setEnrollmentLevelStatus,
  updateEnrollmentStatus,
} from "./mutations";
import {
  getEnrollment,
  listEnrollmentLevels,
  listEnrollments,
} from "./queries";
import {
  enrollmentDeleteSchema,
  enrollmentLevelStatusSchema,
  enrollmentMutationSchema,
  enrollmentStatusSchema,
  listEnrollmentsInput,
} from "./schemas";

export const enrollmentsRouter = createTRPCRouter({
  list: orgProcedure
    .input(listEnrollmentsInput)
    .query(async ({ ctx, input }) => listEnrollments(ctx, input)),
  // Reuses enrollmentDeleteSchema — same {id} shape, no need for a
  // near-duplicate (same call the trainees router makes).
  get: orgProcedure
    .input(enrollmentDeleteSchema)
    .query(async ({ ctx, input }) => getEnrollment(ctx, input.id)),
  levels: orgProcedure
    .input(enrollmentDeleteSchema)
    .query(async ({ ctx, input }) => listEnrollmentLevels(ctx, input.id)),
  // Managing who is enrolled and how far they've got is staff work — a student
  // membership must not reach it (STATE.md D75(1)/D83(1)).
  create: orgContentManagerProcedure
    .input(enrollmentMutationSchema)
    .mutation(async ({ ctx, input }) => createEnrollment(ctx, input)),
  updateStatus: orgContentManagerProcedure
    .input(enrollmentStatusSchema)
    .mutation(async ({ ctx, input }) => updateEnrollmentStatus(ctx, input)),
  setLevelStatus: orgContentManagerProcedure
    .input(enrollmentLevelStatusSchema)
    .mutation(async ({ ctx, input }) => setEnrollmentLevelStatus(ctx, input)),
  delete: orgContentManagerProcedure
    .input(enrollmentDeleteSchema)
    .mutation(async ({ ctx, input }) => deleteEnrollment(ctx, input)),
});
