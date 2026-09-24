import type { OrganizationMembershipRole } from "@/drizzle/schema";
import type { TRPCContext } from "@/integrations/trpc/init";

/** Context shape after `platformOwnerProcedure`'s auth + owner check has run. */
export type PlatformOwnerTRPCContext = TRPCContext & {
  session: NonNullable<TRPCContext["session"]>;
};

/** Context shape after `orgAdminProcedure`'s membership + admin check has run. */
export type OrgAdminTRPCContext = TRPCContext & {
  organizationId: string;
  role: OrganizationMembershipRole;
  session: NonNullable<TRPCContext["session"]>;
};
