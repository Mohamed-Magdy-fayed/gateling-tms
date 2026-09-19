import {
  createTRPCRouter,
  orgContentManagerProcedure,
} from "@/integrations/trpc/init";
import { deleteCertificate, issueCertificate } from "./mutations";
import { getCertificate, listCertificates } from "./queries";
import {
  certificateDeleteSchema,
  certificateMutationSchema,
  listCertificatesInput,
} from "./schemas";

/**
 * Admin/teacher-only throughout, reads included: every row pairs a trainee's
 * name with what they completed, which is a roster a `student` membership must
 * not be able to read — the same call D75(1) made for `responses.list`, D83(1)
 * for `groups.students`, and D86 for `enrollments.list`.
 *
 * A student-facing "my certificates" view needs its own query scoped to the
 * caller's own trainee record, not a widening of these.
 */
export const certificatesRouter = createTRPCRouter({
  list: orgContentManagerProcedure
    .input(listCertificatesInput)
    .query(async ({ ctx, input }) => listCertificates(ctx, input)),
  // Reuses certificateDeleteSchema — same {id} shape, no need for a
  // near-duplicate (same call the trainees and enrollments routers make).
  get: orgContentManagerProcedure
    .input(certificateDeleteSchema)
    .query(async ({ ctx, input }) => getCertificate(ctx, input.id)),
  issue: orgContentManagerProcedure
    .input(certificateMutationSchema)
    .mutation(async ({ ctx, input }) => issueCertificate(ctx, input)),
  delete: orgContentManagerProcedure
    .input(certificateDeleteSchema)
    .mutation(async ({ ctx, input }) => deleteCertificate(ctx, input)),
});
