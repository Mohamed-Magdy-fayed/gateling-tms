import { and, eq, isNull, sql } from "drizzle-orm";
import type { DatabaseOrTransaction } from "@/drizzle";
import {
  GroupStudentsTable,
  SessionStudentsTable,
  SessionsTable,
  TraineesTable,
  UsersTable,
} from "@/drizzle/schema";
import {
  type AttendanceTimings,
  computeLateMinutes,
  matchParticipantToTrainee,
  type ParticipantConnection,
  type RosterCandidate,
  summarizeConnections,
} from "@/features/system/live-classes/attendance/lib/meeting-attendance";

/**
 * The register side of Gateling Meetings' webhooks: what a join or a closed
 * room means for `session_students`. Called from Inngest only — there is no
 * member on the other end, so these take the database, not a tRPC context,
 * and scope every write by the session's own organization.
 *
 * The one rule both writers keep: a teacher's `manual` record is final. The
 * meeting may add the timings it observed to one, never change its verdict or
 * its lateness.
 */

export type MeetingSession = {
  id: string;
  organizationId: string;
  groupId: string;
  scheduledAt: Date;
};

/**
 * The session a meeting belongs to — only while it still points at that
 * meeting. A delivery for a room the session has since replaced says nothing
 * about this class.
 */
export async function findSessionForMeeting(
  db: DatabaseOrTransaction,
  sessionId: string,
  meetingCode: string,
): Promise<MeetingSession | null> {
  const [session] = await db
    .select({
      id: SessionsTable.id,
      organizationId: SessionsTable.organizationId,
      groupId: SessionsTable.groupId,
      scheduledAt: SessionsTable.scheduledAt,
    })
    .from(SessionsTable)
    .where(
      and(
        eq(SessionsTable.id, sessionId),
        eq(SessionsTable.meetingCode, meetingCode),
      ),
    );
  return session ?? null;
}

/**
 * Everyone a joined name may belong to: the group's current roster, each
 * under their trainee name and — when they have an account — the name on
 * it, which is what a signed-in student's join link shows in the room.
 */
export async function listRosterCandidates(
  db: DatabaseOrTransaction,
  session: MeetingSession,
): Promise<RosterCandidate[]> {
  const rows = await db
    .select({
      traineeId: TraineesTable.id,
      traineeName: TraineesTable.name,
      userName: UsersTable.name,
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
    .leftJoin(UsersTable, eq(UsersTable.id, TraineesTable.userId))
    .where(
      and(
        eq(GroupStudentsTable.organizationId, session.organizationId),
        eq(GroupStudentsTable.groupId, session.groupId),
      ),
    );

  return rows.map((row) => ({
    traineeId: row.traineeId,
    names: [row.traineeName, row.userName],
  }));
}

const notManual = sql`${SessionStudentsTable.source} <> 'manual'`;

/**
 * A matched student walked in: present, from their first join. A rejoin
 * keeps the earlier arrival, so dropping out and coming back never makes
 * anyone later than they were.
 */
export async function recordMeetingJoin(
  db: DatabaseOrTransaction,
  session: MeetingSession,
  traineeId: string,
  joinedAt: Date,
): Promise<void> {
  const firstJoin = sql`least(${SessionStudentsTable.joinedAt}, excluded."joinedAt")`;

  await db
    .insert(SessionStudentsTable)
    .values({
      organizationId: session.organizationId,
      sessionId: session.id,
      traineeId,
      status: "present",
      source: "meetings",
      joinedAt,
      lateMinutes: computeLateMinutes(session.scheduledAt, joinedAt),
    })
    .onConflictDoUpdate({
      target: [SessionStudentsTable.sessionId, SessionStudentsTable.traineeId],
      set: {
        status: "present",
        source: "meetings",
        joinedAt: firstJoin,
        lateMinutes: sql`greatest(0, floor(extract(epoch from (${firstJoin} - ${session.scheduledAt.toISOString()}::timestamptz)) / 60))::integer`,
        updatedAt: new Date(),
      },
      setWhere: notManual,
    });
}

export type MeetingParticipant = ParticipantConnection & {
  displayName: string;
  role: "host" | "participant";
};

/**
 * The room closed: settle every matched student's timings from Meetings'
 * full participant log. The join webhook only knows arrivals; this is where
 * time-in-class is summed, and where a join whose webhook was lost still
 * lands on the register.
 *
 * Returns how many trainees were matched.
 */
export async function reconcileMeetingAttendance(
  db: DatabaseOrTransaction,
  session: MeetingSession,
  participants: readonly MeetingParticipant[],
  endedAt: Date,
): Promise<number> {
  const roster = await listRosterCandidates(db, session);
  const connectionsByTrainee = new Map<string, ParticipantConnection[]>();

  for (const participant of participants) {
    if (participant.role === "host") continue;
    const traineeId = matchParticipantToTrainee(
      participant.displayName,
      roster,
    );
    if (!traineeId) continue;
    connectionsByTrainee.set(traineeId, [
      ...(connectionsByTrainee.get(traineeId) ?? []),
      { joinedAt: participant.joinedAt, leftAt: participant.leftAt },
    ]);
  }

  const settled = [...connectionsByTrainee].flatMap(
    ([traineeId, connections]) => {
      const timings = summarizeConnections(connections, endedAt);
      return timings ? [{ traineeId, timings }] : [];
    },
  );

  for (const { traineeId, timings } of settled) {
    await upsertSettledAttendance(db, session, traineeId, timings);
  }

  return settled.length;
}

async function upsertSettledAttendance(
  db: DatabaseOrTransaction,
  session: MeetingSession,
  traineeId: string,
  timings: AttendanceTimings,
): Promise<void> {
  const isManual = sql`${SessionStudentsTable.source} = 'manual'`;

  await db
    .insert(SessionStudentsTable)
    .values({
      organizationId: session.organizationId,
      sessionId: session.id,
      traineeId,
      status: "present",
      source: "meetings",
      ...timings,
      lateMinutes: computeLateMinutes(session.scheduledAt, timings.joinedAt),
    })
    .onConflictDoUpdate({
      target: [SessionStudentsTable.sessionId, SessionStudentsTable.traineeId],
      set: {
        // Timings are observations and fill in on any record; the verdict
        // and the lateness stay the teacher's once they have set them.
        joinedAt: sql`excluded."joinedAt"`,
        leftAt: sql`excluded."leftAt"`,
        attendedMinutes: sql`excluded."attendedMinutes"`,
        status: sql`case when ${isManual} then ${SessionStudentsTable.status} else excluded."status" end`,
        lateMinutes: sql`case when ${isManual} then ${SessionStudentsTable.lateMinutes} else excluded."lateMinutes" end`,
        source: sql`case when ${isManual} then ${SessionStudentsTable.source} else excluded."source" end`,
        updatedAt: new Date(),
      },
    });
}
