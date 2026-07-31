import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import {
  GroupStudentsTable,
  SessionStudentsTable,
  SessionsTable,
  TraineesTable,
} from "@/drizzle/schema";
import { canMarkAttendance } from "./queries";
import type { MarkAttendanceInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

/**
 * The register, as the teacher takes it.
 *
 * This is now the *only* way attendance is recorded (STATE.md D144): onMeeting
 * publishes no webhooks and no participants endpoint, so nothing can observe
 * who was in the room. The record is still stamped `manual`, which keeps the
 * column honest about where the verdict came from and leaves room for an
 * automatic source if onMeeting ever exposes one.
 */
export async function markAttendance(
  ctx: OrgTRPCContext,
  input: MarkAttendanceInput,
): Promise<{ status: MarkAttendanceInput["status"] }> {
  const [session] = await ctx.db
    .select({
      id: SessionsTable.id,
      groupId: SessionsTable.groupId,
      teacherId: SessionsTable.teacherId,
    })
    .from(SessionsTable)
    .where(
      and(
        eq(SessionsTable.id, input.sessionId),
        eq(SessionsTable.organizationId, ctx.organizationId),
      ),
    );

  if (!session) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  if (!canMarkAttendance(ctx, session.teacherId)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: ctx.t("errors.unauthorized"),
    });
  }

  // The trainee has to belong on this class's register — not merely in the
  // org. Checked here rather than left to the foreign key, which only proves
  // the trainee belongs to the same organization.
  //
  // "Belongs" is the same union the register itself shows: on the group's
  // roster now, *or* already carrying a record for this class. Requiring
  // current membership would leave a trainee who has since moved classes with
  // an attendance record nobody can ever correct.
  const [onRoster, [recorded]] = await Promise.all([
    ctx.db
      .select({ traineeId: GroupStudentsTable.traineeId })
      .from(GroupStudentsTable)
      .innerJoin(
        TraineesTable,
        and(
          eq(TraineesTable.id, GroupStudentsTable.traineeId),
          eq(TraineesTable.organizationId, GroupStudentsTable.organizationId),
          isNull(TraineesTable.deletedAt),
        ),
      )
      .where(
        and(
          eq(GroupStudentsTable.organizationId, ctx.organizationId),
          eq(GroupStudentsTable.groupId, session.groupId),
          eq(GroupStudentsTable.traineeId, input.traineeId),
        ),
      ),
    ctx.db
      .select({ traineeId: SessionStudentsTable.traineeId })
      .from(SessionStudentsTable)
      .where(
        and(
          eq(SessionStudentsTable.organizationId, ctx.organizationId),
          eq(SessionStudentsTable.sessionId, input.sessionId),
          eq(SessionStudentsTable.traineeId, input.traineeId),
        ),
      ),
  ]);

  if (onRoster.length === 0 && !recorded) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  await ctx.db
    .insert(SessionStudentsTable)
    .values({
      organizationId: ctx.organizationId,
      sessionId: input.sessionId,
      traineeId: input.traineeId,
      status: input.status,
      source: "manual",
      markedBy: ctx.session.user.id,
    })
    .onConflictDoUpdate({
      target: [SessionStudentsTable.sessionId, SessionStudentsTable.traineeId],
      set: {
        status: input.status,
        source: "manual",
        markedBy: ctx.session.user.id,
        updatedAt: new Date(),
      },
    });

  // `joinedAt`/`leftAt`/`attendedMinutes` are left exactly as they are. No
  // writer fills them any more (D144), but rows seeded or recorded before the
  // provider change still carry them, and a correction to the verdict is not a
  // reason to erase the timings that were observed alongside it.
  return { status: input.status };
}
