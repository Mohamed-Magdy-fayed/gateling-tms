import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { OrganizationsTable, TestimonialsTable } from "@/drizzle/schema";
import {
  isRateLimited,
  testimonialSubmitRatelimit,
} from "@/integrations/ratelimit";
import type { ShowcaseConsentInput, TestimonialSubmitInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

/**
 * Who to record as having written the change, and their user id.
 *
 * `orgAdminProcedure` has already established there is a session, but its
 * narrowing doesn't survive into `OrgTRPCContext`'s nullable `session`, so the
 * guard is repeated here — same shape as every other feature's `actorLabel`.
 */
function actor(ctx: OrgTRPCContext) {
  const session = ctx.session;
  if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });
  return {
    label: session.user.email ?? session.user.id,
    userId: session.user.id,
  };
}

/**
 * Creates or replaces the caller's academy's testimonial.
 *
 * `approvedAt` is always written as null, including on an edit of an already
 * approved row: an approval applies to the words that were reviewed, not to
 * the row forever, so changing them sends it back through moderation. That is
 * also what stops "submit something innocuous, get approved, edit it into
 * anything" — the edit un-publishes it.
 */
export async function submitTestimonial(
  ctx: OrgTRPCContext,
  input: TestimonialSubmitInput,
) {
  if (await isRateLimited(testimonialSubmitRatelimit, ctx.organizationId)) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: ctx.t("testimonials.form.error.rateLimited"),
    });
  }

  const { label, userId } = actor(ctx);
  const values = {
    quote: input.quote,
    authorName: input.authorName,
    authorRole: input.authorRole || null,
    imageUrl: input.imageUrl || null,
    isPublic: input.isPublic,
    approvedAt: null,
  };

  await ctx.db
    .insert(TestimonialsTable)
    .values({
      ...values,
      organizationId: ctx.organizationId,
      authorUserId: userId,
      createdBy: label,
    })
    .onConflictDoUpdate({
      target: TestimonialsTable.organizationId,
      set: {
        ...values,
        authorUserId: userId,
        updatedBy: label,
        updatedAt: new Date(),
      },
    });

  return { submitted: true };
}

/**
 * Opting the academy into (or out of) the landing page's showcase band.
 *
 * Stored as a timestamp rather than a flag so there's an answer to "when did
 * they agree?", and withdrawing clears it outright — no record of a consent
 * that no longer holds.
 */
export async function setShowcaseConsent(
  ctx: OrgTRPCContext,
  input: ShowcaseConsentInput,
) {
  await ctx.db
    .update(OrganizationsTable)
    .set({ publicShowcaseConsentAt: input.consented ? new Date() : null })
    .where(eq(OrganizationsTable.id, ctx.organizationId));

  return { consented: input.consented };
}

/** Stops the dashboard asking this academy for feedback again. */
export async function dismissTestimonialPrompt(ctx: OrgTRPCContext) {
  await ctx.db
    .update(OrganizationsTable)
    .set({ testimonialPromptDismissedAt: new Date() })
    .where(eq(OrganizationsTable.id, ctx.organizationId));

  return { dismissed: true };
}
