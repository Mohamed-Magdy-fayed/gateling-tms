import type { OrganizationMembershipRole } from "@/drizzle/schema";
import type { TRPCContext } from "@/integrations/trpc/init";

/**
 * Context shape after `orgProcedure`'s membership middleware has run.
 *
 * `session` is narrowed to non-null (as in the sessions feature's copy): a
 * teacher may set their *own* availability, so the caller's user id is part
 * of the permission decision rather than an optional extra.
 */
export type OrgTRPCContext = TRPCContext & {
  organizationId: string;
  role: OrganizationMembershipRole;
  session: NonNullable<TRPCContext["session"]>;
};
