import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle";
import type { OrganizationMembershipRole } from "@/drizzle/schema";
import { OrganizationMembershipsTable } from "@/drizzle/schema";
import { getUserSession } from "@/features/core/auth/core";
import type { Cookies } from "@/features/core/auth/types";
import { resolveOrgAccess } from "@/integrations/trpc/org-access";

export type OrgSessionAccess = {
  userId: string;
  // Nullable exactly like `sessionSchema`'s own user shape — an OAuth-created
  // session isn't guaranteed to carry an email.
  userEmail: string | null;
  organizationId: string;
  role: OrganizationMembershipRole;
};

/**
 * `orgProcedure`'s membership resolution for callers that aren't tRPC —
 * route handlers that redirect (OAuth-style integration callbacks) can't go
 * through a procedure, but must apply exactly the same rule: the tenant comes
 * from the session's active organization, never from a request parameter.
 *
 * Returns null whenever `orgProcedure` would throw FORBIDDEN, so the caller
 * decides how to respond (redirect vs. error) instead of this deciding for it.
 */
export async function resolveOrgAccessFromSession(
  cookies: Pick<Cookies, "get">,
): Promise<OrgSessionAccess | null> {
  const session = await getUserSession(cookies);
  if (!session?.user) return null;

  const activeOrganizationId = session.activeOrganizationId;
  const membership = activeOrganizationId
    ? await db.query.OrganizationMembershipsTable.findFirst({
        where: and(
          eq(OrganizationMembershipsTable.userId, session.user.id),
          eq(OrganizationMembershipsTable.organizationId, activeOrganizationId),
        ),
        columns: { role: true },
      })
    : null;

  const access = resolveOrgAccess(activeOrganizationId, membership);
  if (!access) return null;

  return {
    userId: session.user.id,
    userEmail: session.user.email ?? null,
    organizationId: access.organizationId,
    role: access.role,
  };
}
