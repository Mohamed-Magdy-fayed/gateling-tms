import type { OrganizationMembershipRole } from "@/drizzle/schema";
import type { TRPCContext } from "@/integrations/trpc/init";

export type OrgTRPCContext = TRPCContext & {
  organizationId: string;
  role: OrganizationMembershipRole;
};
