import type { OrganizationMembershipRole } from "@/drizzle/schema";
import type { TRPCContext } from "@/integrations/trpc/init";

/** Context shape after `orgAdminProcedure`'s membership middleware has run. */
export type OrgTRPCContext = TRPCContext & {
  organizationId: string;
  role: OrganizationMembershipRole;
  session: NonNullable<TRPCContext["session"]>;
};
