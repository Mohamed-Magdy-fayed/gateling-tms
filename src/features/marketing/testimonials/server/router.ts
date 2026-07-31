import {
  createTRPCRouter,
  orgAdminProcedure,
  publicProcedure,
} from "@/integrations/trpc/init";
import {
  dismissTestimonialPrompt,
  setShowcaseConsent,
  submitTestimonial,
} from "./mutations";
import {
  getShowcaseSummary,
  getTestimonialStatus,
  listPublicTestimonials,
} from "./queries";
import {
  listPublicTestimonialsInput,
  showcaseConsentSchema,
  testimonialSubmitSchema,
} from "./schemas";

/**
 * Two audiences in one router, deliberately.
 *
 * `listPublic`/`showcase` are the only `publicProcedure` reads in the app that
 * touch tenant-owned rows, so both are filtered to explicitly published data
 * and select a narrowed column set (see queries.ts and types.ts) rather than
 * returning table rows.
 *
 * Writing is `orgAdminProcedure`, not `orgProcedure`: speaking publicly for an
 * academy is the owner's call, not any member's.
 */
export const testimonialsRouter = createTRPCRouter({
  listPublic: publicProcedure
    .input(listPublicTestimonialsInput)
    .query(async ({ ctx, input }) => listPublicTestimonials(ctx, input)),
  showcase: publicProcedure.query(async ({ ctx }) => getShowcaseSummary(ctx)),
  status: orgAdminProcedure.query(async ({ ctx }) => getTestimonialStatus(ctx)),
  submit: orgAdminProcedure
    .input(testimonialSubmitSchema)
    .mutation(async ({ ctx, input }) => submitTestimonial(ctx, input)),
  setShowcaseConsent: orgAdminProcedure
    .input(showcaseConsentSchema)
    .mutation(async ({ ctx, input }) => setShowcaseConsent(ctx, input)),
  dismissPrompt: orgAdminProcedure.mutation(async ({ ctx }) =>
    dismissTestimonialPrompt(ctx),
  ),
});
