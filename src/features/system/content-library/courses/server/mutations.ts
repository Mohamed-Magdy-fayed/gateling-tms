import { TRPCError } from "@trpc/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { CoursesTable, OrganizationsTable } from "@/drizzle/schema";
import { assertCanAddCourse } from "@/features/core/organizations/server";
import type {
  CourseDeleteInput,
  CourseMutationInput,
  CourseUpdateInput,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

function actorLabel(ctx: OrgTRPCContext): string {
  const session = ctx.session;
  if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });
  return session.user.email ?? session.user.id;
}

export async function createCourse(
  ctx: OrgTRPCContext,
  input: CourseMutationInput,
) {
  return ctx.db.transaction(async (trx) => {
    const organization = await trx.query.OrganizationsTable.findFirst({
      where: eq(OrganizationsTable.id, ctx.organizationId),
      columns: { plan: true, courseCount: true },
    });

    if (!organization) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.noActiveOrganization"),
      });
    }

    assertCanAddCourse(ctx, organization);

    const [course] = await trx
      .insert(CoursesTable)
      .values({
        organizationId: ctx.organizationId,
        name: input.name,
        description: input.description || null,
        createdBy: actorLabel(ctx),
      })
      .returning({ id: CoursesTable.id });

    await trx
      .update(OrganizationsTable)
      .set({ courseCount: sql`${OrganizationsTable.courseCount} + 1` })
      .where(eq(OrganizationsTable.id, ctx.organizationId));

    return { id: course.id };
  });
}

export async function updateCourse(
  ctx: OrgTRPCContext,
  input: CourseUpdateInput,
) {
  const [updated] = await ctx.db
    .update(CoursesTable)
    .set({
      name: input.name,
      description: input.description || null,
      updatedBy: actorLabel(ctx),
    })
    .where(
      and(
        eq(CoursesTable.id, input.id),
        eq(CoursesTable.organizationId, ctx.organizationId),
        isNull(CoursesTable.deletedAt),
      ),
    )
    .returning({ id: CoursesTable.id });

  if (!updated) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { updated: true };
}

// Soft delete only — levels/lectures/attachments cascading is wired in the
// segment that actually builds them (phase-04.md segment 2); nothing exists
// to cascade to yet, so there's no cascade event to fire here.
export async function deleteCourse(
  ctx: OrgTRPCContext,
  input: CourseDeleteInput,
) {
  return ctx.db.transaction(async (trx) => {
    const [deleted] = await trx
      .update(CoursesTable)
      .set({ deletedAt: new Date(), deletedBy: actorLabel(ctx) })
      .where(
        and(
          eq(CoursesTable.id, input.id),
          eq(CoursesTable.organizationId, ctx.organizationId),
          isNull(CoursesTable.deletedAt),
        ),
      )
      .returning({ id: CoursesTable.id });

    if (!deleted) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    await trx
      .update(OrganizationsTable)
      .set({
        courseCount: sql`greatest(${OrganizationsTable.courseCount} - 1, 0)`,
      })
      .where(eq(OrganizationsTable.id, ctx.organizationId));

    return { deleted: true };
  });
}
