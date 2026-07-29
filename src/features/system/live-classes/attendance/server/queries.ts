import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
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
import { hasActiveZoomClient } from "@/features/system/live-classes/sessions/server/queries";
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
  /**
   * False for a trainee who has attendance recorded for this class but has
   * since left the group — their record stays visible and correctable.
   */
  onRoster: boolean;
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
  /** Tells "no meeting yet" apart from "this academy has no Zoom" (D102). */
  hasActiveZoomClient: boolean;
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

  const rows = await listRegisterRows(ctx, sessionId, session.groupId);

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
    rows,
    canMark: canMarkAttendance(ctx, session.teacherId),
    hasActiveZoomClient: await hasActiveZoomClient(ctx),
  };
}

/**
 * Who belongs on this class's register: everyone currently on the group's
 * roster, **plus** anyone with attendance already recorded for it.
 *
 * Group membership is mutable and the register is history. Deriving the list
 * from the roster alone would make a trainee's recorded attendance vanish the
 * moment they are moved to another class — and, worse, leave it uncorrectable,
 * since the row would still be counted in their progress while being invisible
 * to the teacher. The union keeps every recorded fact reachable without
 * introducing a per-session roster snapshot: the snapshot would be a second
 * source of truth for membership, and everything it buys beyond this is the
 * cosmetic difference of a later-added trainee showing as "not marked" on an
 * older class, which is a true statement about them.
 *
 * Two queries rather than one outer join: each is a plain indexed lookup, and
 * they answer two different questions that happen to be merged for display.
 */
async function listRegisterRows(
  ctx: OrgTRPCContext,
  sessionId: string,
  groupId: string,
): Promise<AttendanceRow[]> {
  const [roster, recorded] = await Promise.all([
    ctx.db
      .select({
        traineeId: TraineesTable.id,
        traineeName: TraineesTable.name,
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
      .where(
        and(
          eq(GroupStudentsTable.organizationId, ctx.organizationId),
          eq(GroupStudentsTable.groupId, groupId),
        ),
      ),
    ctx.db
      .select({
        traineeId: TraineesTable.id,
        traineeName: TraineesTable.name,
        status: SessionStudentsTable.status,
        source: SessionStudentsTable.source,
        joinedAt: SessionStudentsTable.joinedAt,
        leftAt: SessionStudentsTable.leftAt,
        attendedMinutes: SessionStudentsTable.attendedMinutes,
      })
      .from(SessionStudentsTable)
      .innerJoin(
        TraineesTable,
        and(
          eq(TraineesTable.id, SessionStudentsTable.traineeId),
          eq(TraineesTable.organizationId, SessionStudentsTable.organizationId),
          isNull(TraineesTable.deletedAt),
        ),
      )
      .where(
        and(
          eq(SessionStudentsTable.organizationId, ctx.organizationId),
          eq(SessionStudentsTable.sessionId, sessionId),
        ),
      ),
  ]);

  const rowsByTrainee = new Map<string, AttendanceRow>();

  for (const entry of roster) {
    rowsByTrainee.set(entry.traineeId, {
      traineeId: entry.traineeId,
      traineeName: entry.traineeName,
      status: null,
      source: null,
      joinedAt: null,
      leftAt: null,
      attendedMinutes: 0,
      onRoster: true,
    });
  }

  for (const entry of recorded) {
    rowsByTrainee.set(entry.traineeId, {
      ...entry,
      attendedMinutes: entry.attendedMinutes ?? 0,
      onRoster: rowsByTrainee.has(entry.traineeId),
    });
  }

  // `traineeId` tiebreaks so two trainees with the same name keep a stable
  // order between loads (STATE.md D35).
  return [...rowsByTrainee.values()].sort(
    (a, b) =>
      a.traineeName.localeCompare(b.traineeName) ||
      a.traineeId.localeCompare(b.traineeId),
  );
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
