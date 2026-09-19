import { TRPCError } from "@trpc/server";
import { and, DrizzleQueryError, eq, sql } from "drizzle-orm";
import type { PostgresError } from "postgres";
import { OrganizationMembershipsTable, SessionsTable } from "@/drizzle/schema";
import { isSessionEditable } from "../lib/session-editing";
import type { SessionUpdateInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

function isSameInstantConflict(error: unknown): boolean {
  if (!(error instanceof DrizzleQueryError)) return false;
  const cause = error.cause as PostgresError | undefined;
  return (
    cause?.code === "23505" &&
    cause?.constraint_name === "sessions_group_id_scheduled_at_unique"
  );
}

/**
 * Moves, resizes, or reassigns one session from the calendar.
 *
 * Writes `adjustedAt` so the group's next regeneration leaves this row's
 * duration and teacher alone, and pins `plannedAt` to the occurrence the row
 * stands for — a class dragged from Monday to Tuesday is still "Monday's
 * occurrence, held on Tuesday", which is what stops a re-save of the group
 * from putting a second class back on Monday
 * (students/groups/server/regenerate-sessions.ts).
 */
export async function updateSession(
  ctx: OrgTRPCContext,
  input: SessionUpdateInput,
) {
  const session = await ctx.db.query.SessionsTable.findFirst({
    where: and(
      eq(SessionsTable.id, input.id),
      eq(SessionsTable.organizationId, ctx.organizationId),
    ),
    columns: { id: true, status: true },
  });

  if (!session) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("sessions.errors.notFound"),
    });
  }

  if (!isSessionEditable(session.status)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: ctx.t("sessions.errors.notEditable"),
    });
  }

  const teacherId = input.teacherId || null;
  if (teacherId) {
    // `teacherId` is a plain FK to users (sessions-table.ts explains why), so
    // "belongs to this org, and can teach" is checked here.
    const membership =
      await ctx.db.query.OrganizationMembershipsTable.findFirst({
        where: and(
          eq(OrganizationMembershipsTable.organizationId, ctx.organizationId),
          eq(OrganizationMembershipsTable.userId, teacherId),
        ),
        columns: { role: true },
      });
    if (!membership || membership.role === "student") {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("groups.teacherNotFound"),
      });
    }
  }

  try {
    const [updated] = await ctx.db
      .update(SessionsTable)
      .set({
        scheduledAt: input.scheduledAt,
        durationMinutes: input.durationMinutes,
        teacherId,
        adjustedAt: new Date(),
        // A row older than the column has never been moved, so the instant it
        // sits on *is* its pattern occurrence — record that before it drifts.
        plannedAt: sql`COALESCE(${SessionsTable.plannedAt}, ${SessionsTable.scheduledAt})`,
      })
      .where(
        and(
          eq(SessionsTable.id, input.id),
          eq(SessionsTable.organizationId, ctx.organizationId),
          // Re-checked in the write itself, so a class that started between
          // the read above and this statement is not dragged mid-lesson.
          eq(SessionsTable.status, "scheduled"),
        ),
      )
      .returning({ id: SessionsTable.id });

    if (!updated) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: ctx.t("sessions.errors.notEditable"),
      });
    }

    return { id: updated.id };
  } catch (error) {
    if (isSameInstantConflict(error)) {
      throw new TRPCError({
        code: "CONFLICT",
        message: ctx.t("sessions.errors.sameGroupSameTime"),
      });
    }
    throw error;
  }
}
