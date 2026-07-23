import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/drizzle";
import {
  OrganizationMembershipsTable,
  OrganizationsTable,
  UsersTable,
  UserTokensTable,
} from "@/drizzle/schema";
import { hashTokenValue } from "@/features/core/auth/core/token";
import type { TRPCContext } from "@/integrations/trpc/init";
import type { InviteMemberInput, ListMembersInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

export async function getActiveOrganization(ctx: OrgTRPCContext) {
  const organization = await ctx.db.query.OrganizationsTable.findFirst({
    where: eq(OrganizationsTable.id, ctx.organizationId),
  });

  if (!organization) {
    throw new TRPCError({ code: "NOT_FOUND", message: ctx.t("errors.notFound") });
  }

  return { ...organization, role: ctx.role };
}

export async function listMyOrganizations(ctx: TRPCContext) {
  const session = ctx.session;
  if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });

  const memberships = await ctx.db.query.OrganizationMembershipsTable.findMany(
    {
      where: eq(OrganizationMembershipsTable.userId, session.user.id),
      orderBy: [desc(OrganizationMembershipsTable.createdAt)],
      columns: { role: true },
      with: {
        organization: { columns: { id: true, name: true, plan: true } },
      },
    },
  );

  return memberships.map((membership) => ({
    id: membership.organization.id,
    name: membership.organization.name,
    plan: membership.organization.plan,
    role: membership.role,
  }));
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
  const base = eq(
    OrganizationMembershipsTable.organizationId,
    ctx.organizationId,
  );
  const query = input.globalFilter?.trim();
  if (!query) return base;

  return and(
    base,
    or(ilike(UsersTable.name, `%${query}%`), ilike(UsersTable.email, `%${query}%`)),
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
};

export async function listMembers(ctx: OrgTRPCContext, input: ListMembersInput) {
  const whereClause = buildMembersWhereClause(ctx, input);

  const [{ value: total }] = await ctx.db
    .select({ value: count() })
    .from(OrganizationMembershipsTable)
    .innerJoin(UsersTable, eq(UsersTable.id, OrganizationMembershipsTable.userId))
    .where(whereClause);

  const pageCount = Math.max(1, Math.ceil(Number(total) / input.perPage));
  const page = Math.min(input.page, pageCount);
  const offset = (page - 1) * input.perPage;

  const rows: OrganizationMemberRow[] = await ctx.db
    .select({
      userId: OrganizationMembershipsTable.userId,
      role: OrganizationMembershipsTable.role,
      joinedAt: OrganizationMembershipsTable.createdAt,
      name: UsersTable.name,
      email: UsersTable.email,
    })
    .from(OrganizationMembershipsTable)
    .innerJoin(UsersTable, eq(UsersTable.id, OrganizationMembershipsTable.userId))
    .where(whereClause)
    .orderBy(...membersSortExpr(input))
    .limit(input.perPage)
    .offset(offset);

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
