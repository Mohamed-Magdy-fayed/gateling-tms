import type { OrganizationMembershipRole } from "@/drizzle/schema";
import type { TRPCContext } from "@/integrations/trpc/init";
import type { BranchScope } from "@/integrations/trpc/org-access";

/** Context shape after `orgProcedure`'s membership middleware has run. */
export type OrgTRPCContext = TRPCContext & {
  organizationId: string;
  role: OrganizationMembershipRole;
  session: NonNullable<TRPCContext["session"]>;
} & BranchScope;
