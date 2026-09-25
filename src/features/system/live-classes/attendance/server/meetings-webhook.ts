import { and, eq } from "drizzle-orm";
import type { Database } from "@/drizzle";
import { SessionsTable } from "@/drizzle/schema";
import { matchParticipantToTrainee } from "@/features/system/live-classes/attendance/lib/meeting-attendance";
import { parseSessionExternalRef } from "@/features/system/live-classes/sessions/lib/meeting-ref";
import { resolveMeetingsClient } from "@/features/system/live-classes/sessions/server/meetings-config";
import {
  findSessionForMeeting,
  listRosterCandidates,
  reconcileMeetingAttendance,
  recordMeetingJoin,
} from "./meeting-sync";

/**
 * What a verified Gateling Meetings delivery does here — run inline by
 * `app/api/meetings-webhook/route.ts`, not queued (STATE.md D181).
 *
 * These used to be Inngest functions, and in production they never ran: the
 * Inngest app has not synced there (D178), and an unsynced app still accepts
 * events, so the webhook answered 200 while nothing happened. Same failure,
 * same answer as session generation in D179. The work is small, and every
 * write is idempotent (a compare-and-set and upserts), so Meetings retrying a
 * delivery — on a timeout or a thrown error — only repeats a no-op.
 */

type MeetingRef = { code: string; externalRef: string | null };

export type ParticipantJoinOutcome =
  | "not-a-session"
  | "no-session"
  | "unmatched"
  | "recorded";

/**
 * A student joined: present, with lateness, when the name they joined under
 * names exactly one trainee on the class's roster. Anything else is left for
 * the teacher.
 */
export async function handleParticipantJoined(
  db: Database,
  meeting: MeetingRef,
  participantName: string,
  joinedAt: Date,
): Promise<ParticipantJoinOutcome> {
  const sessionId = parseSessionExternalRef(meeting.externalRef);
  if (!sessionId) return "not-a-session";

  const session = await findSessionForMeeting(db, sessionId, meeting.code);
  if (!session) return "no-session";

  const roster = await listRosterCandidates(db, session);
  const traineeId = matchParticipantToTrainee(participantName, roster);
  if (!traineeId) return "unmatched";

  await recordMeetingJoin(db, session, traineeId, joinedAt);
  return "recorded";
}

/**
 * The room closed: the session goes `ongoing` → `completed`, then its
 * register is settled from Meetings' participant log.
 *
 * The status change is a compare-and-set on both the status and the meeting
 * code — a delivery for a room this session no longer points at, or for a
 * class already closed by hand, leaves the row alone. The register is settled
 * either way: a class closed by hand still had people in it.
 */
export async function handleMeetingEnded(
  db: Database,
  meeting: MeetingRef & { endedAt: string | null },
): Promise<void> {
  const sessionId = parseSessionExternalRef(meeting.externalRef);
  if (!sessionId) return;

  await db
    .update(SessionsTable)
    .set({ status: "completed", updatedAt: new Date() })
    .where(
      and(
        eq(SessionsTable.id, sessionId),
        eq(SessionsTable.meetingCode, meeting.code),
        eq(SessionsTable.status, "ongoing"),
      ),
    );

  const session = await findSessionForMeeting(db, sessionId, meeting.code);
  if (!session) return;

  const client = await resolveMeetingsClient(db);
  if (!client) return;

  // A failure throws, the route answers 500, and Meetings redelivers —
  // the status write above is already done and repeats as a no-op.
  const participants = await client.listParticipants(meeting.code);
  await reconcileMeetingAttendance(
    db,
    session,
    participants.map((participant) => ({
      displayName: participant.displayName,
      role: participant.role,
      joinedAt: new Date(participant.joinedAt),
      leftAt: participant.leftAt ? new Date(participant.leftAt) : null,
    })),
    meeting.endedAt ? new Date(meeting.endedAt) : new Date(),
  );
}
