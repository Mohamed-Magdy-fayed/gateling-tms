import { TRPCError } from "@trpc/server";
import { and, DrizzleQueryError, eq } from "drizzle-orm";
import type { PostgresError } from "postgres";
import type { db as Database } from "@/drizzle";
import {
  OrganizationMembershipsTable,
  OrganizationsTable,
  UsersTable,
  UserTokensTable,
} from "@/drizzle/schema";
import { normalizeEmail } from "@/features/core/auth/core/helpers";
import { setActiveOrganization } from "@/features/core/auth/core/session";
import type { TRPCContext } from "@/integrations/trpc/init";
import { inngest } from "@/integrations/inngest/client";
import { organizationMemberInvitedEvent } from "@/integrations/inngest/functions/on-organization-member-invited";
import { loadValidInviteToken } from "./queries";
import { generateUniqueOrganizationShortCode } from "./short-code";
import type {
  AcceptInviteInput,
  InviteMemberInput,
  OrganizationProfileInput,
  RemoveMemberInput,
  SwitchActiveOrganizationInput,
  UpdateMemberRoleInput,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

function nullableTrim(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const MAX_SHORT_CODE_ATTEMPTS = 5;

function isShortCodeConflict(error: unknown): boolean {
  if (!(error instanceof DrizzleQueryError)) return false;
  const cause = error.cause as PostgresError | undefined;
  return (
    cause?.code === "23505" &&
    cause?.constraint_name === "organizations_short_code_idx"
  );
}

/**
 * Core org+admin-membership creation, independent of a tRPC context — reused
 * by both the `organizations.create` mutation (an already-signed-in caller
 * adding an org) and the get-started onboarding action (a brand-new user who
 * doesn't have a session yet at the point their org is created, see
 * `src/features/core/organizations/nextjs/actions/complete-onboarding.ts`).
 * Does not touch cookies/session — callers decide whether/when to activate
 * the new org.
 */
export async function createOrganizationForUser(
  database: typeof Database,
  userId: string,
  input: OrganizationProfileInput,
): Promise<{ organizationId: string }> {
  // generateUniqueOrganizationShortCode's own pre-check (findFirst) can't
  // fully prevent two concurrent calls from generating and inserting the
  // same code before either commits — the pre-check is just an optimization
  // to make a collision rare, not impossible. On a real 23505 against the
  // short-code index, retry with a fresh code instead of failing the
  // request for something the caller never chose.
  for (let attempt = 1; attempt <= MAX_SHORT_CODE_ATTEMPTS; attempt++) {
    try {
      const organizationId = await database.transaction(async (trx) => {
        const shortCode = await generateUniqueOrganizationShortCode(
          trx,
          input.name,
        );

        const [organization] = await trx
          .insert(OrganizationsTable)
          .values({
            shortCode,
            name: input.name.trim(),
            businessName: nullableTrim(input.businessName),
            phone: nullableTrim(input.phone),
            website: nullableTrim(input.website),
            plan: "free",
            ownerId: userId,
          })
          .returning({ id: OrganizationsTable.id });

        await trx.insert(OrganizationMembershipsTable).values({
          organizationId: organization.id,
          userId,
          role: "admin",
        });

        return organization.id;
      });

      return { organizationId };
    } catch (error) {
      if (!isShortCodeConflict(error) || attempt === MAX_SHORT_CODE_ATTEMPTS) {
        throw error;
      }
    }
  }

  // Unreachable — the loop above always either returns or throws on its
  // last attempt — but keeps the function's return type from needing
  // `undefined`.
  throw new Error("createOrganizationForUser: retry loop exited without a result");
}

export async function createOrganization(
  ctx: TRPCContext,
  input: OrganizationProfileInput,
) {
  const session = ctx.session;
  if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });

  const { organizationId } = await createOrganizationForUser(
    ctx.db,
    session.user.id,
    input,
  );
  await setActiveOrganization(organizationId, ctx.cookies);
  return { organizationId };
}

export async function updateOrganization(
  ctx: OrgTRPCContext,
  input: OrganizationProfileInput,
) {
  await ctx.db
    .update(OrganizationsTable)
    .set({
      name: input.name.trim(),
      businessName: nullableTrim(input.businessName),
      phone: nullableTrim(input.phone),
      website: nullableTrim(input.website),
    })
    .where(eq(OrganizationsTable.id, ctx.organizationId));

  return { updated: true };
}

export async function switchActiveOrganization(
  ctx: TRPCContext,
  input: SwitchActiveOrganizationInput,
) {
  const session = ctx.session;
  if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });

  const membership = await ctx.db.query.OrganizationMembershipsTable.findFirst(
    {
      where: and(
        eq(OrganizationMembershipsTable.userId, session.user.id),
        eq(OrganizationMembershipsTable.organizationId, input.organizationId),
      ),
      columns: { organizationId: true },
    },
  );

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: ctx.t("errors.noActiveOrganization"),
    });
  }

  await setActiveOrganization(input.organizationId, ctx.cookies);

  return { organizationId: input.organizationId };
}

export async function inviteMember(
  ctx: OrgTRPCContext,
  input: InviteMemberInput,
) {
  const session = ctx.session;
  if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });

  const normalizedEmail = normalizeEmail(input.email);

  const existingUser = await ctx.db.query.UsersTable.findFirst({
    where: eq(UsersTable.email, normalizedEmail),
    columns: { id: true },
  });

  if (existingUser) {
    const existingMembership =
      await ctx.db.query.OrganizationMembershipsTable.findFirst({
        where: and(
          eq(OrganizationMembershipsTable.organizationId, ctx.organizationId),
          eq(OrganizationMembershipsTable.userId, existingUser.id),
        ),
        columns: { userId: true },
      });

    if (existingMembership) {
      throw new TRPCError({
        code: "CONFLICT",
        message: ctx.t("organizations.members.alreadyMember"),
      });
    }
  }

  try {
    await inngest.send(
      organizationMemberInvitedEvent.create({
        organizationId: ctx.organizationId,
        email: normalizedEmail,
        role: input.role,
        invitedByUserId: session.user.id,
        locale: ctx.locale,
      }),
    );
  } catch (error) {
    // Unlike sign-up's verification email (non-fatal — the user's account
    // still works and they can request a resend), a failed enqueue here
    // means no token is ever created and the invite silently never existed.
    // Report it rather than lying that it was sent, but never leak the raw
    // transport error (e.g. a fetch/connection failure) to the client.
    console.error("Failed to enqueue organization/member-invited event", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: ctx.t("organizations.members.inviteFailed"),
    });
  }

  return { invited: true };
}

export async function acceptInvite(ctx: TRPCContext, input: AcceptInviteInput) {
  const session = ctx.session;
  if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });

  const { tokenRow, metadata } = await loadValidInviteToken(ctx, input.token);

  if (normalizeEmail(metadata.email) !== normalizeEmail(session.user.email ?? "")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: ctx.t("organizations.invite.emailMismatch"),
    });
  }

  const organizationId = metadata.organizationId;
  const role = metadata.role;

  await ctx.db.transaction(async (trx) => {
    await trx
      .insert(OrganizationMembershipsTable)
      .values({ organizationId, userId: session.user.id, role })
      .onConflictDoNothing();

    await trx
      .update(UserTokensTable)
      .set({ consumedAt: new Date(), userId: session.user.id })
      .where(eq(UserTokensTable.id, tokenRow.id));
  });

  await setActiveOrganization(organizationId, ctx.cookies);

  return { organizationId };
}

/**
 * Locks every admin row for this org (SELECT ... FOR UPDATE) until the
 * enclosing transaction commits, so a concurrent demotion/removal of a
 * *different* admin can't read the same "N admins" snapshot and also pass
 * the last-admin check — without the lock, two concurrent requests could
 * both see 2 admins, both proceed, and leave the org with zero.
 */
async function lockAdminRowsForUpdate(
  trx: Parameters<Parameters<OrgTRPCContext["db"]["transaction"]>[0]>[0],
  organizationId: string,
) {
  return trx
    .select({ userId: OrganizationMembershipsTable.userId })
    .from(OrganizationMembershipsTable)
    .where(
      and(
        eq(OrganizationMembershipsTable.organizationId, organizationId),
        eq(OrganizationMembershipsTable.role, "admin"),
      ),
    )
    .for("update");
}

export async function updateMemberRole(
  ctx: OrgTRPCContext,
  input: UpdateMemberRoleInput,
) {
  await ctx.db.transaction(async (trx) => {
    const membership = await trx.query.OrganizationMembershipsTable.findFirst(
      {
        where: and(
          eq(OrganizationMembershipsTable.organizationId, ctx.organizationId),
          eq(OrganizationMembershipsTable.userId, input.userId),
        ),
        columns: { role: true },
      },
    );

    if (!membership) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    if (membership.role === "admin" && input.role !== "admin") {
      const admins = await lockAdminRowsForUpdate(trx, ctx.organizationId);
      if (admins.length <= 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: ctx.t("organizations.members.lastAdmin"),
        });
      }
    }

    await trx
      .update(OrganizationMembershipsTable)
      .set({ role: input.role })
      .where(
        and(
          eq(OrganizationMembershipsTable.organizationId, ctx.organizationId),
          eq(OrganizationMembershipsTable.userId, input.userId),
        ),
      );
  });

  return { updated: true };
}

export async function removeMember(
  ctx: OrgTRPCContext,
  input: RemoveMemberInput,
) {
  await ctx.db.transaction(async (trx) => {
    const membership = await trx.query.OrganizationMembershipsTable.findFirst(
      {
        where: and(
          eq(OrganizationMembershipsTable.organizationId, ctx.organizationId),
          eq(OrganizationMembershipsTable.userId, input.userId),
        ),
        columns: { role: true },
      },
    );

    if (!membership) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    if (membership.role === "admin") {
      const admins = await lockAdminRowsForUpdate(trx, ctx.organizationId);
      if (admins.length <= 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: ctx.t("organizations.members.lastAdmin"),
        });
      }
    }

    await trx
      .delete(OrganizationMembershipsTable)
      .where(
        and(
          eq(OrganizationMembershipsTable.organizationId, ctx.organizationId),
          eq(OrganizationMembershipsTable.userId, input.userId),
        ),
      );
  });

  return { removed: true };
}
