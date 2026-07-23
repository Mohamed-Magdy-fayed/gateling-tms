import { TRPCError } from "@trpc/server";
import { and, count, eq } from "drizzle-orm";
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

export async function createOrganization(
  ctx: TRPCContext,
  input: OrganizationProfileInput,
) {
  const session = ctx.session;
  if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });

  const organizationId = await ctx.db.transaction(async (trx) => {
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
        ownerId: session.user.id,
      })
      .returning({ id: OrganizationsTable.id });

    await trx.insert(OrganizationMembershipsTable).values({
      organizationId: organization.id,
      userId: session.user.id,
      role: "admin",
    });

    return organization.id;
  });

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

async function countAdmins(ctx: OrgTRPCContext) {
  const [{ value: adminCount }] = await ctx.db
    .select({ value: count() })
    .from(OrganizationMembershipsTable)
    .where(
      and(
        eq(OrganizationMembershipsTable.organizationId, ctx.organizationId),
        eq(OrganizationMembershipsTable.role, "admin"),
      ),
    );
  return Number(adminCount);
}

export async function updateMemberRole(
  ctx: OrgTRPCContext,
  input: UpdateMemberRoleInput,
) {
  const membership = await ctx.db.query.OrganizationMembershipsTable.findFirst(
    {
      where: and(
        eq(OrganizationMembershipsTable.organizationId, ctx.organizationId),
        eq(OrganizationMembershipsTable.userId, input.userId),
      ),
      columns: { role: true },
    },
  );

  if (!membership) {
    throw new TRPCError({ code: "NOT_FOUND", message: ctx.t("errors.notFound") });
  }

  if (membership.role === "admin" && input.role !== "admin") {
    if ((await countAdmins(ctx)) <= 1) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: ctx.t("organizations.members.lastAdmin"),
      });
    }
  }

  await ctx.db
    .update(OrganizationMembershipsTable)
    .set({ role: input.role })
    .where(
      and(
        eq(OrganizationMembershipsTable.organizationId, ctx.organizationId),
        eq(OrganizationMembershipsTable.userId, input.userId),
      ),
    );

  return { updated: true };
}

export async function removeMember(
  ctx: OrgTRPCContext,
  input: RemoveMemberInput,
) {
  const membership = await ctx.db.query.OrganizationMembershipsTable.findFirst(
    {
      where: and(
        eq(OrganizationMembershipsTable.organizationId, ctx.organizationId),
        eq(OrganizationMembershipsTable.userId, input.userId),
      ),
      columns: { role: true },
    },
  );

  if (!membership) {
    throw new TRPCError({ code: "NOT_FOUND", message: ctx.t("errors.notFound") });
  }

  if (membership.role === "admin" && (await countAdmins(ctx)) <= 1) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: ctx.t("organizations.members.lastAdmin"),
    });
  }

  await ctx.db
    .delete(OrganizationMembershipsTable)
    .where(
      and(
        eq(OrganizationMembershipsTable.organizationId, ctx.organizationId),
        eq(OrganizationMembershipsTable.userId, input.userId),
      ),
    );

  return { removed: true };
}
