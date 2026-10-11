import { and, asc, eq } from "drizzle-orm";
import type { db as database } from "@/drizzle";
import {
  BranchesTable,
  OrganizationMembershipBranchesTable,
  type OrganizationMembershipRole,
} from "@/drizzle/schema";
import { type BranchScope, resolveBranchAccess } from "./org-access";

/**
 * Loads what `resolveBranchAccess` needs — the academy's branches and the
 * member's branch assignments — and resolves the request's branch scope.
 * Shared by `orgProcedure` and the non-tRPC session-access helper so both
 * apply exactly the same rule.
 */
export async function loadBranchScope(
  db: typeof database,
  input: {
    organizationId: string;
    userId: string;
    role: OrganizationMembershipRole;
    requestedBranchId: string | null | undefined;
  },
): Promise<BranchScope> {
  const [branches, assignments] = await Promise.all([
    db
      .select({ id: BranchesTable.id })
      .from(BranchesTable)
      .where(eq(BranchesTable.organizationId, input.organizationId))
      .orderBy(asc(BranchesTable.createdAt), asc(BranchesTable.name)),
    db
      .select({ branchId: OrganizationMembershipBranchesTable.branchId })
      .from(OrganizationMembershipBranchesTable)
      .where(
        and(
          eq(
            OrganizationMembershipBranchesTable.organizationId,
            input.organizationId,
          ),
          eq(OrganizationMembershipBranchesTable.userId, input.userId),
        ),
      ),
  ]);

  return resolveBranchAccess({
    role: input.role,
    academyBranchIds: branches.map((b) => b.id),
    assignedBranchIds: assignments.map((a) => a.branchId),
    requestedBranchId: input.requestedBranchId,
  });
}
