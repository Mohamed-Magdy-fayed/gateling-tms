import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import {
  FormResponsesTable,
  FormsTable,
  LevelsTable,
  PlacementTestsTable,
} from "@/drizzle/schema";
import type { OrgTRPCContext } from "./types";

const placementTestProjection = {
  id: PlacementTestsTable.id,
  traineeId: PlacementTestsTable.traineeId,
  formId: PlacementTestsTable.formId,
  formTitle: FormsTable.title,
  assignedLevelId: PlacementTestsTable.assignedLevelId,
  assignedLevelName: LevelsTable.name,
  responseId: PlacementTestsTable.responseId,
  // Read through the response rather than denormalized onto the test — the
  // scorer already owns it, and null legitimately means "needs manual
  // grading" (STATE.md D73).
  score: FormResponsesTable.score,
  status: PlacementTestsTable.status,
  feedback: PlacementTestsTable.feedback,
  scheduledAt: PlacementTestsTable.scheduledAt,
  completedAt: PlacementTestsTable.completedAt,
  createdAt: PlacementTestsTable.createdAt,
};

/** One trainee's placement tests, newest first. */
export async function listPlacementTests(
  ctx: OrgTRPCContext,
  traineeId: string,
) {
  return ctx.db
    .select(placementTestProjection)
    .from(PlacementTestsTable)
    .leftJoin(FormsTable, eq(FormsTable.id, PlacementTestsTable.formId))
    .leftJoin(
      LevelsTable,
      eq(LevelsTable.id, PlacementTestsTable.assignedLevelId),
    )
    .leftJoin(
      FormResponsesTable,
      eq(FormResponsesTable.id, PlacementTestsTable.responseId),
    )
    .where(
      and(
        eq(PlacementTestsTable.traineeId, traineeId),
        eq(PlacementTestsTable.organizationId, ctx.organizationId),
      ),
    )
    .orderBy(desc(PlacementTestsTable.createdAt), desc(PlacementTestsTable.id));
}

export async function getPlacementTest(ctx: OrgTRPCContext, id: string) {
  const [placementTest] = await ctx.db
    .select(placementTestProjection)
    .from(PlacementTestsTable)
    .leftJoin(FormsTable, eq(FormsTable.id, PlacementTestsTable.formId))
    .leftJoin(
      LevelsTable,
      eq(LevelsTable.id, PlacementTestsTable.assignedLevelId),
    )
    .leftJoin(
      FormResponsesTable,
      eq(FormResponsesTable.id, PlacementTestsTable.responseId),
    )
    .where(
      and(
        eq(PlacementTestsTable.id, id),
        eq(PlacementTestsTable.organizationId, ctx.organizationId),
      ),
    );

  if (!placementTest) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return placementTest;
}
