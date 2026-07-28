import {
  createTRPCRouter,
  orgContentManagerProcedure,
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

/**
 * Admin/teacher-only throughout, reads included: the list pairs every
 * trainee's name with what they're studying and how far they've got, which is
 * a roster a `student` membership must not be able to read — the same call
 * D75(1) made for `responses.list` and D83(1) for `groups.students`.
 *
 * A future student-facing "my courses" view needs its own query scoped to the
 * caller's own trainee record, not a widening of these.
 */
export const enrollmentsRouter = createTRPCRouter({
  list: orgContentManagerProcedure
    .input(listEnrollmentsInput)
    .query(async ({ ctx, input }) => listEnrollments(ctx, input)),
  // Reuses enrollmentDeleteSchema — same {id} shape, no need for a
  // near-duplicate (same call the trainees router makes).
  get: orgContentManagerProcedure
    .input(enrollmentDeleteSchema)
    .query(async ({ ctx, input }) => getEnrollment(ctx, input.id)),
  levels: orgContentManagerProcedure
    .input(enrollmentDeleteSchema)
    .query(async ({ ctx, input }) => listEnrollmentLevels(ctx, input.id)),
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
