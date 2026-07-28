import { TRPCError } from "@trpc/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { OrganizationsTable, TraineesTable } from "@/drizzle/schema";
import { assertCanAddStudent } from "@/features/core/organizations/server";
import type {
  TraineeDeleteInput,
  TraineeMutationInput,
  TraineeUpdateInput,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

function actorLabel(ctx: OrgTRPCContext): string {
  const session = ctx.session;
  if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });
  return session.user.email ?? session.user.id;
}

export async function createTrainee(
  ctx: OrgTRPCContext,
  input: TraineeMutationInput,
) {
  return ctx.db.transaction(async (trx) => {
    // Locks the org row for the rest of this transaction so two concurrent
    // creates can't both read the same studentCount, both pass
    // assertCanAddStudent, and both insert — same pattern as
    // courses/server/mutations.ts's createCourse (STATE.md D49/D63).
    const [organization] = await trx
      .select({
        plan: OrganizationsTable.plan,
        studentCount: OrganizationsTable.studentCount,
      })
      .from(OrganizationsTable)
      .where(eq(OrganizationsTable.id, ctx.organizationId))
      .for("update");

    if (!organization) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.noActiveOrganization"),
      });
    }

    assertCanAddStudent(ctx, organization);

    const [trainee] = await trx
      .insert(TraineesTable)
      .values({
        organizationId: ctx.organizationId,
        name: input.name,
        phone: input.phone || null,
        email: input.email || null,
        createdBy: actorLabel(ctx),
      })
      .returning({ id: TraineesTable.id });

    await trx
      .update(OrganizationsTable)
      .set({ studentCount: sql`${OrganizationsTable.studentCount} + 1` })
      .where(eq(OrganizationsTable.id, ctx.organizationId));

    return { id: trainee.id };
  });
}

export async function updateTrainee(
  ctx: OrgTRPCContext,
  input: TraineeUpdateInput,
) {
  const [updated] = await ctx.db
    .update(TraineesTable)
    .set({
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
      updatedBy: actorLabel(ctx),
    })
    .where(
      and(
        eq(TraineesTable.id, input.id),
        eq(TraineesTable.organizationId, ctx.organizationId),
        isNull(TraineesTable.deletedAt),
      ),
    )
    .returning({ id: TraineesTable.id });

  if (!updated) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { updated: true };
}

// Soft delete only — mirrors courses' deleteCourse (STATE.md D63): keeps the
// trainee's historical enrollments/certificates/group memberships intact
// instead of cascading a hard delete through them.
export async function deleteTrainee(
  ctx: OrgTRPCContext,
  input: TraineeDeleteInput,
) {
  return ctx.db.transaction(async (trx) => {
    const [deleted] = await trx
      .update(TraineesTable)
      .set({ deletedAt: new Date(), deletedBy: actorLabel(ctx) })
      .where(
        and(
          eq(TraineesTable.id, input.id),
          eq(TraineesTable.organizationId, ctx.organizationId),
          isNull(TraineesTable.deletedAt),
        ),
      )
      .returning({ id: TraineesTable.id });

    if (!deleted) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    await trx
      .update(OrganizationsTable)
      .set({
        studentCount: sql`greatest(${OrganizationsTable.studentCount} - 1, 0)`,
      })
      .where(eq(OrganizationsTable.id, ctx.organizationId));

    return { deleted: true };
  });
}
