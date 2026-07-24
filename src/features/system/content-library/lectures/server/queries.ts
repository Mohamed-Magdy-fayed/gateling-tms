import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { LecturesTable, LevelsTable } from "@/drizzle/schema";
import type { ListLecturesInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

/** Confirms the level exists and belongs to the caller's org — every lectures mutation scopes through this first so a lecture can never be attached to (or read from) another org's level. */
export async function assertLevelInOrg(ctx: OrgTRPCContext, levelId: string) {
  const level = await ctx.db.query.LevelsTable.findFirst({
    where: and(
      eq(LevelsTable.id, levelId),
      eq(LevelsTable.organizationId, ctx.organizationId),
    ),
    columns: { id: true },
  });

  if (!level) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return level;
}

export async function listLectures(
  ctx: OrgTRPCContext,
  input: ListLecturesInput,
) {
  await assertLevelInOrg(ctx, input.levelId);

  return ctx.db
    .select()
    .from(LecturesTable)
    .where(
      and(
        eq(LecturesTable.levelId, input.levelId),
        eq(LecturesTable.organizationId, ctx.organizationId),
      ),
    )
    .orderBy(asc(LecturesTable.order), asc(LecturesTable.id));
}
