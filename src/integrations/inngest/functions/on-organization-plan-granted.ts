import { and, eq, isNull } from "drizzle-orm";
import { eventType } from "inngest";
import { z } from "zod";

import { baseUrl } from "@/data/env/server";
import { db } from "@/drizzle";
import {
  OrganizationMembershipsTable,
  OrganizationsTable,
  organizationPlanValues,
  UsersTable,
} from "@/drizzle/schema";
import { sendPlanGrantedEmail } from "@/features/core/organizations/emails/send-plan-granted";
import { inngest } from "../client";

const planGrantedSchema = z.object({
  organizationId: z.string(),
  plan: z.enum(organizationPlanValues),
  // ISO timestamp of the grant; with the org id it names this one change
  // (it is also the event id, so a double send is deduplicated).
  grantedAt: z.string(),
  // Captured from ctx.locale in the grant mutation — users have no stored
  // locale, see send-plan-granted.ts.
  locale: z.string(),
});

export const organizationPlanGrantedEvent = eventType(
  "organization/plan-granted",
  { schema: planGrantedSchema },
);

/** The event id for one grant: Inngest drops a second event with the same id. */
export function planGrantedEventId(organizationId: string, grantedAt: string) {
  return `plan-granted:${organizationId}:${grantedAt}`;
}

type PlanGrantedStep = {
  run: <T>(id: string, fn: () => Promise<T>) => Promise<unknown>;
};

/**
 * Emails every admin of the academy about its new plan (design doc
 * `academy-preferences.md` 7B, R11). Each admin's send is its own step, so a
 * retry after one SMTP failure replays the sends that already went out from
 * Inngest's memo instead of mailing those admins again.
 *
 * Exported apart from the function so a test can drive it with a memoizing
 * step, the way Inngest replays a retried run.
 */
export async function handleOrganizationPlanGranted({
  event,
  step,
}: {
  event: { data: z.infer<typeof planGrantedSchema> };
  step: PlanGrantedStep;
}) {
  const { organizationId, plan, locale } = event.data;

  const [organization] = await db
    .select({ name: OrganizationsTable.name })
    .from(OrganizationsTable)
    .where(eq(OrganizationsTable.id, organizationId));
  if (!organization) return { sent: 0 };

  const admins = await db
    .select({
      id: UsersTable.id,
      email: UsersTable.email,
      name: UsersTable.name,
    })
    .from(OrganizationMembershipsTable)
    .innerJoin(
      UsersTable,
      eq(UsersTable.id, OrganizationMembershipsTable.userId),
    )
    .where(
      and(
        eq(OrganizationMembershipsTable.organizationId, organizationId),
        eq(OrganizationMembershipsTable.role, "admin"),
        isNull(UsersTable.deletedAt),
      ),
    );

  const settingsUrl = new URL("/settings", baseUrl).toString();

  for (const admin of admins) {
    await step.run(`email-admin-${admin.id}`, () =>
      sendPlanGrantedEmail({
        to: admin.email,
        recipientName: admin.name,
        organizationName: organization.name,
        plan,
        settingsUrl,
        locale,
      }),
    );
  }

  return { sent: admins.length };
}

export const onOrganizationPlanGranted = inngest.createFunction(
  {
    id: "on-organization-plan-granted",
    triggers: [organizationPlanGrantedEvent],
  },
  handleOrganizationPlanGranted,
);
