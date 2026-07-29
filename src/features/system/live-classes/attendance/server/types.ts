import type { OrganizationMembershipRole } from "@/drizzle/schema";
import type { TRPCContext } from "@/integrations/trpc/init";

/**
 * Context shape after `orgProcedure`'s membership middleware has run.
 *
 * `session` is narrowed to non-null (as in the sessions feature's copy):
 * correcting a register is allowed for the teacher running that class, so the
 * caller's own user id is part of the decision, not an optional extra.
 */
export type OrgTRPCContext = TRPCContext & {
  organizationId: string;
  role: OrganizationMembershipRole;
  session: NonNullable<TRPCContext["session"]>;
};
