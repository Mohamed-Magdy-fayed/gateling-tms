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

/** The branches a request may read, resolved once per request by `orgProcedure`. */
export type BranchScope = {
  /** Branches this request reads from: one when a branch is selected, else every visible one. */
  branchIds: string[];
  /** The selected branch, or null for "All branches". */
  activeBranchId: string | null;
  /** Every branch this member may switch to — what the switcher lists. */
  visibleBranchIds: string[];
};

/**
 * Pure decision core of the branch scope (docs/designs/academy-branches.md).
 * Admins see every branch of the academy. Other members see the branches
 * they're assigned to — or, with no assignments at all, the whole academy,
 * which is how every member behaved before branches existed. A requested
 * branch outside what the member may see is ignored rather than trusted, and
 * a member who can only see one branch is always "in" it.
 */
export function resolveBranchAccess(input: {
  role: OrganizationMembershipRole;
  academyBranchIds: string[];
  assignedBranchIds: string[];
  requestedBranchId: string | null | undefined;
}): BranchScope {
  const assigned = input.assignedBranchIds.filter((id) =>
    input.academyBranchIds.includes(id),
  );
  const visible =
    input.role === "admin" || assigned.length === 0
      ? input.academyBranchIds
      : assigned;

  if (input.requestedBranchId && visible.includes(input.requestedBranchId)) {
    return {
      branchIds: [input.requestedBranchId],
      activeBranchId: input.requestedBranchId,
      visibleBranchIds: visible,
    };
  }
  if (visible.length === 1) {
    return { branchIds: visible, activeBranchId: visible[0], visibleBranchIds: visible };
  }
  // A requested branch the member can't see falls back to their own, so a
  // stale or forged selection never widens access.
  if (input.requestedBranchId && input.role !== "admin" && assigned.length > 0) {
    return { branchIds: [visible[0]], activeBranchId: visible[0], visibleBranchIds: visible };
  }
  return { branchIds: visible, activeBranchId: null, visibleBranchIds: visible };
}

/**
 * The branch a new row goes into: the one the caller named (if it's inside
 * the current scope), else the active branch. Null means the caller has to
 * choose — "All branches" is selected and no branch was named.
 */
export function pickWriteBranch(
  scope: Pick<BranchScope, "branchIds" | "activeBranchId">,
  requestedBranchId: string | null | undefined,
): string | null {
  if (requestedBranchId) {
    return scope.branchIds.includes(requestedBranchId) ? requestedBranchId : null;
  }
  return scope.activeBranchId;
}
