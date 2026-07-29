import type { OrganizationMembershipRole } from "@/drizzle/schema";
import type { TRPCContext } from "@/integrations/trpc/init";

/**
 * Context shape after `orgProcedure`'s membership middleware has run.
 *
 * `session` is narrowed to non-null here, unlike the sibling entities' copies
 * of this type: `orgProcedure` builds on `protectedProcedure`, which already
 * guarantees it, and these queries need the caller's own user id to decide who
 * may hold a Zoom host link (lib/session-links.ts) — a `?? ""` fallback would
 * make that decision look optional when it isn't.
 */
export type OrgTRPCContext = TRPCContext & {
  organizationId: string;
  role: OrganizationMembershipRole;
  session: NonNullable<TRPCContext["session"]>;
};
