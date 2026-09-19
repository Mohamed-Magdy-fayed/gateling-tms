import { and, desc, eq } from "drizzle-orm";
import { TraineeNotesTable } from "@/drizzle/schema";
import type { ListTraineeNotesInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

/**
 * Newest first — a profile's notes read as a log, and the most recent entry
 * is the one staff came to check. No pagination: notes are short and a
 * student rarely accrues more than a handful.
 *
 * Scoped by organizationId as well as traineeId, so asking for another
 * tenant's trainee yields an empty list rather than their notes.
 */
export async function listTraineeNotes(
  ctx: OrgTRPCContext,
  input: ListTraineeNotesInput,
) {
  return ctx.db
    .select({
      id: TraineeNotesTable.id,
      body: TraineeNotesTable.body,
      createdAt: TraineeNotesTable.createdAt,
      createdBy: TraineeNotesTable.createdBy,
      updatedAt: TraineeNotesTable.updatedAt,
      updatedBy: TraineeNotesTable.updatedBy,
    })
    .from(TraineeNotesTable)
    .where(
      and(
        eq(TraineeNotesTable.organizationId, ctx.organizationId),
        eq(TraineeNotesTable.traineeId, input.traineeId),
      ),
    )
    .orderBy(desc(TraineeNotesTable.createdAt), desc(TraineeNotesTable.id));
}
