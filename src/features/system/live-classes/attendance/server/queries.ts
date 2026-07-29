import { TRPCError } from "@trpc/server";
import { and, asc, eq, isNull } from "drizzle-orm";
import {
  type AttendanceSource,
  type AttendanceStatus,
  GroupStudentsTable,
  GroupsTable,
  SessionStudentsTable,
  SessionsTable,
  TraineesTable,
  UsersTable,
} from "@/drizzle/schema";
import {
  canHostSession,
  resolveSessionLinks,
} from "@/features/system/live-classes/sessions/lib/session-links";
import type { OrgTRPCContext } from "./types";

export type AttendanceRow = {
  traineeId: string;
  traineeName: string;
  /** Null until someone — Zoom or a teacher — has said anything. */
  status: AttendanceStatus | null;
  source: AttendanceSource | null;
  joinedAt: Date | null;
  leftAt: Date | null;
  attendedMinutes: number;
};

export type SessionAttendance = {
  session: {
    id: string;
    scheduledAt: Date;
    durationMinutes: number;
    status: (typeof SessionsTable.$inferSelect)["status"];
    groupId: string;
    groupName: string;
    teacherId: string | null;
    teacherName: string | null;
    joinUrl: string | null;
    startUrl: string | null;
    recordingUrl: string | null;
    recordingPassword: string | null;
  };
  rows: AttendanceRow[];
  /** Whether this viewer may correct the register (see `router.ts`). */
  canMark: boolean;
};

/**
 * One class's register: every trainee on the group's roster, with whatever is
 * known about their attendance.
 *
 * The roster drives the list rather than the recorded rows — a class of twenty
 * where nobody showed up is twenty absences, not an empty page — so trainees
 * with nothing recorded appear with a null status.
 */
export async function getSessionAttendance(
  ctx: OrgTRPCContext,
  sessionId: string,
): Promise<SessionAttendance> {
  const [session] = await ctx.db
    .select({
      id: SessionsTable.id,
      scheduledAt: SessionsTable.scheduledAt,
      durationMinutes: SessionsTable.durationMinutes,
      status: SessionsTable.status,
      groupId: SessionsTable.groupId,
      groupName: GroupsTable.name,
      teacherId: SessionsTable.teacherId,
      teacherName: UsersTable.name,
      zoomJoinUrl: SessionsTable.zoomJoinUrl,
      // Selected so the per-viewer decision can be taken per row, never
      // returned raw (STATE.md D103).
      zoomStartUrl: SessionsTable.zoomStartUrl,
      recordingUrl: SessionsTable.zoomRecordingUrl,
      recordingPassword: SessionsTable.zoomRecordingPassword,
    })
    .from(SessionsTable)
    .innerJoin(
      GroupsTable,
      and(
        eq(GroupsTable.id, SessionsTable.groupId),
        eq(GroupsTable.organizationId, SessionsTable.organizationId),
      ),
    )
    .leftJoin(UsersTable, eq(UsersTable.id, SessionsTable.teacherId))
    .where(
      and(
        eq(SessionsTable.id, sessionId),
        eq(SessionsTable.organizationId, ctx.organizationId),
      ),
    );

  if (!session) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  const rows = await ctx.db
    .select({
      traineeId: TraineesTable.id,
      traineeName: TraineesTable.name,
      status: SessionStudentsTable.status,
      source: SessionStudentsTable.source,
      joinedAt: SessionStudentsTable.joinedAt,
      leftAt: SessionStudentsTable.leftAt,
      attendedMinutes: SessionStudentsTable.attendedMinutes,
    })
    .from(GroupStudentsTable)
    .innerJoin(
      TraineesTable,
      and(
        eq(TraineesTable.id, GroupStudentsTable.traineeId),
        eq(TraineesTable.organizationId, GroupStudentsTable.organizationId),
        isNull(TraineesTable.deletedAt),
      ),
    )
    .leftJoin(
      SessionStudentsTable,
      and(
        eq(SessionStudentsTable.sessionId, sessionId),
        eq(SessionStudentsTable.traineeId, GroupStudentsTable.traineeId),
        eq(
          SessionStudentsTable.organizationId,
          GroupStudentsTable.organizationId,
        ),
      ),
    )
    .where(
      and(
        eq(GroupStudentsTable.organizationId, ctx.organizationId),
        eq(GroupStudentsTable.groupId, session.groupId),
      ),
    )
    // `id` tiebreaks so two trainees with the same name keep a stable order
    // between loads (STATE.md D35).
    .orderBy(asc(TraineesTable.name), asc(TraineesTable.id));

  const links = resolveSessionLinks(
    { userId: ctx.session.user.id, role: ctx.role },
    {
      teacherId: session.teacherId,
      zoomJoinUrl: session.zoomJoinUrl,
      zoomStartUrl: session.zoomStartUrl,
    },
  );

  return {
    session: {
      id: session.id,
      scheduledAt: session.scheduledAt,
      durationMinutes: session.durationMinutes,
      status: session.status,
      groupId: session.groupId,
      groupName: session.groupName,
      teacherId: session.teacherId,
      teacherName: session.teacherName,
      joinUrl: links.joinUrl,
      startUrl: links.startUrl,
      recordingUrl: session.recordingUrl,
      recordingPassword: session.recordingPassword,
    },
    rows: rows.map((row) => ({
      traineeId: row.traineeId,
      traineeName: row.traineeName,
      status: row.status,
      source: row.source,
      joinedAt: row.joinedAt,
      leftAt: row.leftAt,
      attendedMinutes: row.attendedMinutes ?? 0,
    })),
    canMark: canMarkAttendance(ctx, session.teacherId),
  };
}

/**
 * The register belongs to whoever runs the class: the assigned teacher, plus
 * admins, who answer for the org's records as a whole. Deliberately the same
 * set that may hold the Zoom host link — a teacher covering someone else's
 * class is not the person who marks its register either.
 */
export function canMarkAttendance(
  ctx: OrgTRPCContext,
  teacherId: string | null,
): boolean {
  return canHostSession(
    { userId: ctx.session.user.id, role: ctx.role },
    teacherId,
  );
}
