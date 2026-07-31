import { and, count, desc, eq, isNotNull } from "drizzle-orm";
import {
  OrganizationsTable,
  TestimonialsTable,
  UsersTable,
} from "@/drizzle/schema";
import type { TRPCContext } from "@/integrations/trpc/init";
import type { ListPublicTestimonialsInput } from "./schemas";
import { showcaseAcademyCount } from "./showcase-count";
import type {
  OrgTRPCContext,
  PublicTestimonial,
  ShowcaseSummary,
} from "./types";

/**
 * The two conditions that must both hold before a testimonial is public: the
 * author consented, and Gateling approved the wording. Written once so the
 * public list and any future public surface can't diverge on it.
 */
const publishedCondition = and(
  eq(TestimonialsTable.isPublic, true),
  isNotNull(TestimonialsTable.approvedAt),
);

/** Anonymous read. Selects only the columns a visitor is meant to see. */
export async function listPublicTestimonials(
  ctx: Pick<TRPCContext, "db">,
  input: ListPublicTestimonialsInput,
): Promise<PublicTestimonial[]> {
  return (
    ctx.db
      .select({
        id: TestimonialsTable.id,
        quote: TestimonialsTable.quote,
        authorName: TestimonialsTable.authorName,
        authorRole: TestimonialsTable.authorRole,
        imageUrl: TestimonialsTable.imageUrl,
        academyName: OrganizationsTable.name,
      })
      .from(TestimonialsTable)
      .innerJoin(
        OrganizationsTable,
        eq(TestimonialsTable.organizationId, OrganizationsTable.id),
      )
      .where(publishedCondition)
      // `id` as tiebreaker so equal approval timestamps don't leave the order
      // (and the "first quote on the home page") nondeterministic — same reason
      // every other list query in this repo carries one.
      .orderBy(desc(TestimonialsTable.approvedAt), desc(TestimonialsTable.id))
      .limit(input.limit)
  );
}

/**
 * The landing hero band: academies that opted in, and the headline figure.
 *
 * The figure counts **every** live academy, not just the consented ones — it
 * is a "how big is this" number, whereas consent governs whose name and photo
 * appear. See showcase-count.ts for what the figure actually claims.
 */
export async function getShowcaseSummary(
  ctx: Pick<TRPCContext, "db">,
): Promise<ShowcaseSummary> {
  const [totals] = await ctx.db
    .select({ value: count() })
    .from(OrganizationsTable);

  const academies = await ctx.db
    .select({
      name: OrganizationsTable.name,
      imageUrl: UsersTable.imageUrl,
    })
    .from(OrganizationsTable)
    .leftJoin(UsersTable, eq(OrganizationsTable.ownerId, UsersTable.id))
    .where(isNotNull(OrganizationsTable.publicShowcaseConsentAt))
    .orderBy(
      desc(OrganizationsTable.publicShowcaseConsentAt),
      desc(OrganizationsTable.id),
    )
    .limit(5);

  return {
    academies,
    academyCount: showcaseAcademyCount(totals?.value ?? 0),
  };
}

/** The caller's own organization's testimonial, if it has written one. */
export async function getOwnTestimonial(ctx: OrgTRPCContext) {
  const [testimonial] = await ctx.db
    .select({
      id: TestimonialsTable.id,
      quote: TestimonialsTable.quote,
      authorName: TestimonialsTable.authorName,
      authorRole: TestimonialsTable.authorRole,
      imageUrl: TestimonialsTable.imageUrl,
      isPublic: TestimonialsTable.isPublic,
      approvedAt: TestimonialsTable.approvedAt,
      updatedAt: TestimonialsTable.updatedAt,
    })
    .from(TestimonialsTable)
    .where(eq(TestimonialsTable.organizationId, ctx.organizationId))
    .limit(1);

  return testimonial ?? null;
}

/**
 * What the dashboard prompt needs: whether to ask this academy for feedback,
 * and the current showcase consent so the settings card can render without a
 * second round trip.
 */
export async function getTestimonialStatus(ctx: OrgTRPCContext) {
  const [organization] = await ctx.db
    .select({
      publicShowcaseConsentAt: OrganizationsTable.publicShowcaseConsentAt,
      promptDismissedAt: OrganizationsTable.testimonialPromptDismissedAt,
    })
    .from(OrganizationsTable)
    .where(eq(OrganizationsTable.id, ctx.organizationId))
    .limit(1);

  const testimonial = await getOwnTestimonial(ctx);

  return {
    testimonial,
    hasShowcaseConsent: organization?.publicShowcaseConsentAt != null,
    // Only admins ever see the prompt (the router gates that); this decides
    // whether there is anything left to ask for.
    shouldPrompt:
      testimonial === null && organization?.promptDismissedAt == null,
  };
}
