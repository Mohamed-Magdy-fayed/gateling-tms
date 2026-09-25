import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { likeContains } from "@/drizzle/lib/search";
import {
  OrganizationMembershipsTable,
  type OrganizationPlan,
  OrganizationsTable,
  UsersTable,
} from "@/drizzle/schema";
import type { TRPCContext } from "@/integrations/trpc/init";
import type { ListPlatformOrganizationsInput } from "./schemas";

type PlatformOwnerContext = TRPCContext & {
  session: NonNullable<TRPCContext["session"]>;
};

export type PlatformOrganizationRow = {
  id: string;
  name: string;
  shortCode: string;
  plan: OrganizationPlan;
  studentCount: number;
  courseCount: number;
  storageBytes: number;
  // The academy's owner (`organizations.ownerId`), not every admin: one join,
  // never a fan-out over memberships. Null when the owner account is gone.
  adminEmail: string | null;
  planGrantedBy: string | null;
  planGrantedAt: Date | null;
  // The platform owner is a member of this academy — the "Yours" tag.
  isMine: boolean;
};

function buildWhereClause(input: ListPlatformOrganizationsInput) {
  const query = input.globalFilter?.trim();
  if (!query) return undefined;

  return or(
    ilike(OrganizationsTable.name, likeContains(query)),
    ilike(OrganizationsTable.shortCode, likeContains(query)),
    ilike(UsersTable.email, likeContains(query)),
  );
}

/**
 * Every academy on the deployment, for the platform owner's Academies list.
 *
 * The one query that deliberately reads across tenants. It is only reachable
 * through `platformOwnerProcedure`, and it returns what the owner needs to
 * grant a plan — name, owner email, plan and the usage counters the plan
 * limits are enforced against — never any academy's own records.
 */
export async function listPlatformOrganizations(
  ctx: PlatformOwnerContext,
  input: ListPlatformOrganizationsInput,
) {
  const whereClause = buildWhereClause(input);

  const [{ value: total }] = await ctx.db
    .select({ value: count() })
    .from(OrganizationsTable)
    .leftJoin(UsersTable, eq(UsersTable.id, OrganizationsTable.ownerId))
    .where(whereClause);

  const pageCount = Math.max(1, Math.ceil(Number(total) / input.perPage));
  const page = Math.min(input.page, pageCount);
  const offset = (page - 1) * input.perPage;

  const organizations = await ctx.db
    .select({
      id: OrganizationsTable.id,
      name: OrganizationsTable.name,
      shortCode: OrganizationsTable.shortCode,
      plan: OrganizationsTable.plan,
      studentCount: OrganizationsTable.studentCount,
      courseCount: OrganizationsTable.courseCount,
      storageBytes: OrganizationsTable.storageBytes,
      adminEmail: UsersTable.email,
      planGrantedBy: OrganizationsTable.planGrantedBy,
      planGrantedAt: OrganizationsTable.planGrantedAt,
    })
    .from(OrganizationsTable)
    .leftJoin(UsersTable, eq(UsersTable.id, OrganizationsTable.ownerId))
    .where(whereClause)
    // Newest first; the id breaks ties so offset paging stays deterministic.
    .orderBy(desc(OrganizationsTable.createdAt), desc(OrganizationsTable.id))
    .limit(input.perPage)
    .offset(offset);

  const pageIds = organizations.map((organization) => organization.id);
  const myMemberships = pageIds.length
    ? await ctx.db
        .select({ organizationId: OrganizationMembershipsTable.organizationId })
        .from(OrganizationMembershipsTable)
        .where(
          and(
            eq(OrganizationMembershipsTable.userId, ctx.session.user.id),
            inArray(OrganizationMembershipsTable.organizationId, pageIds),
          ),
        )
    : [];
  const mine = new Set(myMemberships.map((row) => row.organizationId));

  const rows: PlatformOrganizationRow[] = organizations.map((organization) => ({
    ...organization,
    isMine: mine.has(organization.id),
  }));

  return { rows, page, pageCount, total: Number(total) };
}
