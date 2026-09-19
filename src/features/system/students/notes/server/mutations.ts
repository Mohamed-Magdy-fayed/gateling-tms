import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import { TraineeNotesTable, TraineesTable } from "@/drizzle/schema";
import type {
  TraineeNoteDeleteInput,
  TraineeNoteMutationInput,
  TraineeNoteUpdateInput,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

function actorLabel(ctx: OrgTRPCContext): string {
  const session = ctx.session;
  if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });
  return session.user.email ?? session.user.id;
}

export async function createTraineeNote(
  ctx: OrgTRPCContext,
  input: TraineeNoteMutationInput,
) {
  // The composite FK already refuses a trainee from another organization;
  // this check is what turns that into a NOT_FOUND the form can show, and
  // what keeps notes off a soft-deleted student.
  const trainee = await ctx.db.query.TraineesTable.findFirst({
    where: and(
      eq(TraineesTable.id, input.traineeId),
      eq(TraineesTable.organizationId, ctx.organizationId),
      isNull(TraineesTable.deletedAt),
    ),
    columns: { id: true },
  });

  if (!trainee) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("enrollments.traineeNotFound"),
    });
  }

  const [note] = await ctx.db
    .insert(TraineeNotesTable)
    .values({
      organizationId: ctx.organizationId,
      traineeId: input.traineeId,
      body: input.body,
      createdBy: actorLabel(ctx),
    })
    .returning({ id: TraineeNotesTable.id });

  return { id: note.id };
}

export async function updateTraineeNote(
  ctx: OrgTRPCContext,
  input: TraineeNoteUpdateInput,
) {
  const [updated] = await ctx.db
    .update(TraineeNotesTable)
    .set({ body: input.body, updatedBy: actorLabel(ctx) })
    .where(
      and(
        eq(TraineeNotesTable.id, input.id),
        eq(TraineeNotesTable.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: TraineeNotesTable.id });

  if (!updated) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { updated: true };
}

export async function deleteTraineeNote(
  ctx: OrgTRPCContext,
  input: TraineeNoteDeleteInput,
) {
  const [deleted] = await ctx.db
    .delete(TraineeNotesTable)
    .where(
      and(
        eq(TraineeNotesTable.id, input.id),
        eq(TraineeNotesTable.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: TraineeNotesTable.id });

  if (!deleted) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { deleted: true };
}
