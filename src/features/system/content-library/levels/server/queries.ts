import { TRPCError } from "@trpc/server";
import { and, asc, eq, isNull } from "drizzle-orm";
import { CoursesTable, LevelsTable } from "@/drizzle/schema";
import type { ListLevelsInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

/** Confirms the course exists, belongs to the caller's org, and isn't soft-deleted — every levels mutation scopes through this first so a level can never be attached to (or read from) another org's course. */
export async function assertCourseInOrg(ctx: OrgTRPCContext, courseId: string) {
  const course = await ctx.db.query.CoursesTable.findFirst({
    where: and(
      eq(CoursesTable.id, courseId),
      eq(CoursesTable.organizationId, ctx.organizationId),
      isNull(CoursesTable.deletedAt),
    ),
    columns: { id: true },
  });

  if (!course) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return course;
}

export async function listLevels(ctx: OrgTRPCContext, input: ListLevelsInput) {
  await assertCourseInOrg(ctx, input.courseId);

  return ctx.db
    .select()
    .from(LevelsTable)
    .where(
      and(
        eq(LevelsTable.courseId, input.courseId),
        eq(LevelsTable.organizationId, ctx.organizationId),
      ),
    )
    .orderBy(asc(LevelsTable.order), asc(LevelsTable.id));
}
