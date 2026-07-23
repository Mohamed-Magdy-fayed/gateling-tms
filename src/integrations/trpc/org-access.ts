import type { OrganizationMembershipRole } from "@/drizzle/schema";

/**
 * Pure decision core of `orgProcedure`'s membership check, pulled out of
 * `init.ts` so it's testable without a live DB/env (see
 * `tests/org-access.test.ts`) — `init.ts` still does the actual
 * `OrganizationMembershipsTable.findFirst` lookup and just hands the result
 * here. Returns `null` for every case that should end in FORBIDDEN: no
 * active org on the session, or no membership row for that org (including
 * the cross-org case — a session whose `activeOrganizationId` points at an
 * org the caller isn't a member of).
 */
export function resolveOrgAccess(
  activeOrganizationId: string | null | undefined,
  membership: { role: OrganizationMembershipRole } | null | undefined,
): { organizationId: string; role: OrganizationMembershipRole } | null {
  if (!activeOrganizationId || !membership) return null;
  return { organizationId: activeOrganizationId, role: membership.role };
}
