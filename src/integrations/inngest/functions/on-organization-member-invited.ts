import { and, eq, sql } from "drizzle-orm";
import { eventType } from "inngest";
import { z } from "zod";

import { baseUrl } from "@/data/env/server";
import { db } from "@/drizzle";
import {
  organizationMembershipRoleValues,
  OrganizationsTable,
  UsersTable,
  UserTokensTable,
} from "@/drizzle/schema";
import {
  createTokenValue,
  EMAIL_TOKEN_TTL_MS,
  hashTokenValue,
} from "@/features/core/auth/core/token";
import { sendOrganizationInviteEmail } from "@/features/core/organizations/emails/send-organization-invite";
import { inngest } from "../client";

export const organizationMemberInvitedEvent = eventType(
  "organization/member-invited",
  {
    schema: z.object({
      organizationId: z.string(),
      email: z.string(),
      role: z.enum(organizationMembershipRoleValues),
      invitedByUserId: z.string(),
    }),
  },
);

export const onOrganizationMemberInvited = inngest.createFunction(
  { id: "on-organization-member-invited", triggers: [organizationMemberInvitedEvent] },
  async ({ event, step }) => {
    return step.run("create-token-and-send-invite-email", async () => {
      const { organizationId, email, role, invitedByUserId } = event.data;

      const [organization, inviter] = await Promise.all([
        db.query.OrganizationsTable.findFirst({
          where: eq(OrganizationsTable.id, organizationId),
          columns: { name: true },
        }),
        db.query.UsersTable.findFirst({
          where: eq(UsersTable.id, invitedByUserId),
          columns: { name: true },
        }),
      ]);

      if (!organization) return { skipped: true };

      const existingUser = await db.query.UsersTable.findFirst({
        where: eq(UsersTable.email, email),
        columns: { id: true },
      });

      // Inngest can retry/redeliver this step — delete any prior invite
      // token for this exact org+email pair first, mirroring
      // on-user-registered.ts's idempotency pattern, so a retry never
      // accumulates extra live tokens for the same invite.
      await db
        .delete(UserTokensTable)
        .where(
          and(
            eq(UserTokensTable.type, "org_invite"),
            sql`${UserTokensTable.metadata}->>'organizationId' = ${organizationId}`,
            sql`${UserTokensTable.metadata}->>'email' = ${email}`,
          ),
        );

      const rawToken = createTokenValue();
      await db.insert(UserTokensTable).values({
        userId: existingUser?.id ?? null,
        tokenHash: hashTokenValue(rawToken),
        type: "org_invite",
        expiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
        metadata: { organizationId, email, role },
      });

      const acceptUrl = new URL(`/invite/${rawToken}`, baseUrl);

      await sendOrganizationInviteEmail({
        to: email,
        organizationName: organization.name,
        inviterName: inviter?.name ?? null,
        acceptUrl: acceptUrl.toString(),
      });

      return { sent: true };
    });
  },
);
