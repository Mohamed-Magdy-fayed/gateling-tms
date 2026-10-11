import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/drizzle";
import { likeContains } from "@/drizzle/lib/search";
import {
  BranchesTable,
  OrganizationMembershipBranchesTable,
  OrganizationMembershipsTable,
  OrganizationsTable,
  UsersTable,
  UserTokensTable,
} from "@/drizzle/schema";
import { hashTokenValue } from "@/features/core/auth/core/token";
import type { TRPCContext } from "@/integrations/trpc/init";
import { resolveBranchAccess } from "@/integrations/trpc/org-access";
import { CLIENT_TABLE_ROW_LIMIT } from "@/lib/list-limits";
import { loadMemberBranchIds } from "./branches";
import { PLAN_LIMITS } from "./limits";
import type { InviteMemberInput, ListMembersInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

export async function getActiveOrganization(ctx: OrgTRPCContext) {
  const [organization, user] = await Promise.all([
    ctx.db.query.OrganizationsTable.findFirst({
      where: eq(OrganizationsTable.id, ctx.organizationId),
    }),
    ctx.db.query.UsersTable.findFirst({
      where: eq(UsersTable.id, ctx.session.user.id),
      columns: { isPlatformOwner: true },
    }),
  ]);

  if (!organization) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  // Whether to *show* the owner-only surfaces. Display only: every owner
  // route re-checks the flag itself through `platformOwnerProcedure`.
  return {
    ...organization,
    role: ctx.role,
    isPlatformOwner: user?.isPlatformOwner ?? false,
  };
}

/**
 * Plan usage for the settings page's usage meters (phase-08.md step 2).
 *
 * The three values come off the organization row, not from fresh counts —
 * they are the same maintained counters `assertCanAddStudent` and friends are
 * enforced against, so showing anything else would let the meter disagree
 * with the error a user hits on create. Drift between the counters and the
 * rows is the reconciliation job's problem, not this query's (see
 * `usage.ts`).
 */
export async function getOrganizationUsage(ctx: OrgTRPCContext) {
  const organization = await ctx.db.query.OrganizationsTable.findFirst({
    where: eq(OrganizationsTable.id, ctx.organizationId),
    columns: {
      plan: true,
      planGrantedBy: true,
      studentCount: true,
      courseCount: true,
      storageBytes: true,
    },
  });

  if (!organization) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.noActiveOrganization"),
    });
  }

  const limits = PLAN_LIMITS[organization.plan];

  return {
    plan: organization.plan,
    // Set once the platform owner has granted a plan by hand (R8); the usage
    // card then says the plan comes from Gateling instead of "coming soon".
    isGranted: organization.planGrantedBy !== null,
    usage: {
      students: organization.studentCount,
      courses: organization.courseCount,
      storageBytes: organization.storageBytes,
    },
    limits: {
      students: limits.maxStudents,
      courses: limits.maxCourses,
      storageBytes: limits.maxStorageBytes,
    },
  };
}

export async function listMyOrganizations(ctx: TRPCContext) {
  const session = ctx.session;
  if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });

  const memberships = await ctx.db.query.OrganizationMembershipsTable.findMany({
    where: eq(OrganizationMembershipsTable.userId, session.user.id),
    orderBy: [desc(OrganizationMembershipsTable.createdAt)],
    columns: { role: true },
    with: {
      organization: { columns: { id: true, name: true, plan: true } },
    },
  });

  const organizationIds = memberships.map((m) => m.organization.id);
  const [branches, assignments] = organizationIds.length
    ? await Promise.all([
        ctx.db
          .select({
            id: BranchesTable.id,
            organizationId: BranchesTable.organizationId,
            name: BranchesTable.name,
            isActive: BranchesTable.isActive,
          })
          .from(BranchesTable)
          .where(inArray(BranchesTable.organizationId, organizationIds))
          .orderBy(asc(BranchesTable.createdAt), asc(BranchesTable.name)),
        ctx.db
          .select({ branchId: OrganizationMembershipBranchesTable.branchId })
          .from(OrganizationMembershipBranchesTable)
          .where(
            and(
              eq(OrganizationMembershipBranchesTable.userId, session.user.id),
              inArray(
                OrganizationMembershipBranchesTable.organizationId,
                organizationIds,
              ),
            ),
          ),
      ])
    : [[], []];
  const assignedBranchIds = assignments.map((a) => a.branchId);

  // Same rule as orgProcedure, so the switcher offers exactly what a request
  // would be allowed to read. The active academy also resolves the session's
  // branch, which is what the switcher shows as selected.
  return memberships.map((membership) => {
    const organizationId = membership.organization.id;
    const academyBranches = branches.filter(
      (b) => b.organizationId === organizationId,
    );
    const isActiveOrganization =
      session.activeOrganizationId === organizationId;
    const scope = resolveBranchAccess({
      role: membership.role,
      academyBranchIds: academyBranches.map((b) => b.id),
      assignedBranchIds,
      requestedBranchId: isActiveOrganization ? session.activeBranchId : null,
    });

    return {
      id: organizationId,
      name: membership.organization.name,
      plan: membership.organization.plan,
      role: membership.role,
      branches: academyBranches
        .filter((b) => scope.visibleBranchIds.includes(b.id))
        .map(({ id, name, isActive }) => ({ id, name, isActive })),
      // "All branches" is a choice only when there is more than one to add up.
      canSelectAll: scope.visibleBranchIds.length > 1,
      activeBranchId: isActiveOrganization ? scope.activeBranchId : null,
    };
  });
}

/**
 * Picks the org a freshly-created session should treat as active: the most
 * recently joined membership. Used by sign-in/OAuth/passkey-auth so a
 * seeded or returning user with exactly one org lands straight in the
 * dashboard instead of being routed through onboarding again — see
 * STATE.md D48.
 */
export async function resolveDefaultActiveOrganizationId(
  userId: string,
): Promise<string | null> {
  const membership = await db.query.OrganizationMembershipsTable.findFirst({
    where: eq(OrganizationMembershipsTable.userId, userId),
    orderBy: [desc(OrganizationMembershipsTable.createdAt)],
    columns: { organizationId: true },
  });

  return membership?.organizationId ?? null;
}

function buildMembersWhereClause(ctx: OrgTRPCContext, input: ListMembersInput) {
  // A role filter narrows the org's members; it never widens past them. The
  // calendar's teacher list asks for staff only, so a large academy's
  // students can't push teachers off the one page it loads.
  const base = and(
    eq(OrganizationMembershipsTable.organizationId, ctx.organizationId),
    input.roles?.length
      ? inArray(OrganizationMembershipsTable.role, input.roles)
      : undefined,
  );
  const query = input.globalFilter?.trim();
  if (!query) return base;

  return and(
    base,
    or(
      ilike(UsersTable.name, likeContains(query)),
      ilike(UsersTable.email, likeContains(query)),
    ),
  );
}

// Every branch appends `userId` as a tiebreaker so ties in the requested
// sort don't leave row order (and therefore offset pagination) nondeterministic —
// same reasoning as the demo module's `sortExpr` (STATE.md D35).
function membersSortExpr(input: ListMembersInput) {
  const firstSort = input.sorting[0];
  if (!firstSort) {
    return [asc(UsersTable.name), asc(OrganizationMembershipsTable.userId)];
  }

  switch (firstSort.id) {
    case "role":
      return [
        firstSort.desc
          ? desc(OrganizationMembershipsTable.role)
          : asc(OrganizationMembershipsTable.role),
        asc(OrganizationMembershipsTable.userId),
      ];
    case "joinedAt":
      return [
        firstSort.desc
          ? desc(OrganizationMembershipsTable.createdAt)
          : asc(OrganizationMembershipsTable.createdAt),
        asc(OrganizationMembershipsTable.userId),
      ];
    default:
      return [
        firstSort.desc ? desc(UsersTable.name) : asc(UsersTable.name),
        asc(OrganizationMembershipsTable.userId),
      ];
  }
}

export type OrganizationMemberRow = {
  userId: string;
  role: (typeof OrganizationMembershipsTable.$inferSelect)["role"];
  joinedAt: Date;
  name: string | null;
  email: string | null;
  /** Assigned branches; empty = every branch (always so for admins). */
  branchIds: string[];
};

const memberRowSelection = {
  userId: OrganizationMembershipsTable.userId,
  role: OrganizationMembershipsTable.role,
  joinedAt: OrganizationMembershipsTable.createdAt,
  name: UsersTable.name,
  email: UsersTable.email,
};

/**
 * Every member of the org, for the client-mode members table on the
 * organization settings page — staff and student accounts of one academy, so
 * the page sorts and filters it in the browser. Pickers keep using the paged
 * `listMembers`.
 */
export async function listAllMembers(
  ctx: OrgTRPCContext,
): Promise<OrganizationMemberRow[]> {
  const rows = await ctx.db
    .select(memberRowSelection)
    .from(OrganizationMembershipsTable)
    .innerJoin(
      UsersTable,
      eq(UsersTable.id, OrganizationMembershipsTable.userId),
    )
    .where(eq(OrganizationMembershipsTable.organizationId, ctx.organizationId))
    .orderBy(asc(UsersTable.name), asc(OrganizationMembershipsTable.userId))
    .limit(CLIENT_TABLE_ROW_LIMIT);
  return withBranchIds(ctx, rows);
}

async function withBranchIds(
  ctx: OrgTRPCContext,
  rows: Omit<OrganizationMemberRow, "branchIds">[],
): Promise<OrganizationMemberRow[]> {
  const byUser = await loadMemberBranchIds(
    ctx,
    rows.map((row) => row.userId),
  );
  return rows.map((row) => ({
    ...row,
    branchIds: byUser.get(row.userId) ?? [],
  }));
}

export async function listMembers(
  ctx: OrgTRPCContext,
  input: ListMembersInput,
) {
  const whereClause = buildMembersWhereClause(ctx, input);

  const [{ value: total }] = await ctx.db
    .select({ value: count() })
    .from(OrganizationMembershipsTable)
    .innerJoin(
      UsersTable,
      eq(UsersTable.id, OrganizationMembershipsTable.userId),
    )
    .where(whereClause);

  const pageCount = Math.max(1, Math.ceil(Number(total) / input.perPage));
  const page = Math.min(input.page, pageCount);
  const offset = (page - 1) * input.perPage;

  const memberRows = await ctx.db
    .select(memberRowSelection)
    .from(OrganizationMembershipsTable)
    .innerJoin(
      UsersTable,
      eq(UsersTable.id, OrganizationMembershipsTable.userId),
    )
    .where(whereClause)
    .orderBy(...membersSortExpr(input))
    .limit(input.perPage)
    .offset(offset);

  const rows = await withBranchIds(ctx, memberRows);
  return { rows, page, pageCount, total: Number(total) };
}

type InviteTokenMetadata = {
  organizationId: string;
  email: string;
  role: InviteMemberInput["role"];
};

function invalidInviteError(ctx: Pick<TRPCContext, "t">) {
  return new TRPCError({
    code: "NOT_FOUND",
    message: ctx.t("organizations.invite.invalid"),
  });
}

/**
 * Shared token-lookup + validation between `acceptInvite` (mutations.ts,
 * consumes the token) and `previewInvite` below (read-only) — both need the
 * exact same "is this a live, well-formed org_invite token" check.
 */
export async function loadValidInviteToken(
  ctx: Pick<TRPCContext, "db" | "t">,
  token: string,
) {
  const tokenHash = hashTokenValue(token);
  const tokenRow = await ctx.db.query.UserTokensTable.findFirst({
    where: and(
      eq(UserTokensTable.tokenHash, tokenHash),
      eq(UserTokensTable.type, "org_invite"),
    ),
  });

  if (
    !tokenRow ||
    tokenRow.consumedAt != null ||
    tokenRow.expiresAt.getTime() <= Date.now()
  ) {
    throw invalidInviteError(ctx);
  }

  const metadata = (tokenRow.metadata ?? {}) as Partial<InviteTokenMetadata>;
  if (!metadata.organizationId || !metadata.email || !metadata.role) {
    throw invalidInviteError(ctx);
  }

  return { tokenRow, metadata: metadata as InviteTokenMetadata };
}

/**
 * Read-only look at an invite token, for the accept-invite landing page to
 * decide where to send a not-yet-signed-in visitor: sign up (no account
 * exists for the invited email yet) or sign in (it does) — see STATE.md D49.
 */
export async function previewInvite(ctx: TRPCContext, token: string) {
  const { metadata } = await loadValidInviteToken(ctx, token);

  const [organization, existingUser] = await Promise.all([
    ctx.db.query.OrganizationsTable.findFirst({
      where: eq(OrganizationsTable.id, metadata.organizationId),
      columns: { name: true },
    }),
    ctx.db.query.UsersTable.findFirst({
      where: eq(UsersTable.email, metadata.email),
      columns: { id: true },
    }),
  ]);

  if (!organization) throw invalidInviteError(ctx);

  return {
    email: metadata.email,
    organizationName: organization.name,
    hasAccount: existingUser != null,
  };
}
