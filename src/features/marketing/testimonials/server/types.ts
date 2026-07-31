import type { OrganizationMembershipRole } from "@/drizzle/schema";
import type { TRPCContext } from "@/integrations/trpc/init";

/** Context shape after `orgProcedure`'s membership middleware has run. */
export type OrgTRPCContext = TRPCContext & {
  organizationId: string;
  role: OrganizationMembershipRole;
};

/**
 * What an anonymous visitor is allowed to see. Deliberately narrower than the
 * table row: no `organizationId`, no `authorUserId`, no timestamps — a public
 * page has no use for them, and not selecting them means they can't leak
 * through a careless spread later.
 */
export type PublicTestimonial = {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string | null;
  imageUrl: string | null;
  academyName: string;
};

/** The hero band: consented academies, plus the headline figure. */
export type ShowcaseSummary = {
  academies: { name: string; imageUrl: string | null }[];
  academyCount: number;
};
