import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { OrganizationsTable } from "@/drizzle/schema";
import type { TRPCContext } from "@/integrations/trpc/init";
import type { SetOrganizationPlanInput } from "./schemas";

type PlatformOwnerContext = TRPCContext & {
  session: NonNullable<TRPCContext["session"]>;
};

/**
 * The platform owner sets an academy's plan by hand — a grant, with no
 * payment behind it (design doc `academy-preferences.md` R8). The plan limits
 * (`PLAN_LIMITS`) read `organizations.plan` on every check, so they follow
 * the new plan on the next request.
 *
 * Downgrades are allowed and touch no data: an academy above the new plan's
 * limits keeps everything it has and simply can't add more. Saving the plan
 * it already has changes nothing, not even the audit columns, so "who granted
 * this" keeps pointing at the grant that actually changed it.
 */
export async function setOrganizationPlan(
  ctx: PlatformOwnerContext,
  input: SetOrganizationPlanInput,
) {
  const organization = await ctx.db.query.OrganizationsTable.findFirst({
    where: eq(OrganizationsTable.id, input.organizationId),
    columns: { plan: true },
  });

  if (!organization) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  if (organization.plan === input.plan) {
    return {
      organizationId: input.organizationId,
      plan: input.plan,
      changed: false,
    };
  }

  await ctx.db
    .update(OrganizationsTable)
    .set({
      plan: input.plan,
      planGrantedBy: ctx.session.user.email ?? ctx.session.user.id,
      planGrantedAt: new Date(),
    })
    .where(eq(OrganizationsTable.id, input.organizationId));

  return {
    organizationId: input.organizationId,
    plan: input.plan,
    changed: true,
  };
}
