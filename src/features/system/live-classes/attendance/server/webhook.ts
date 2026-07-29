import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/drizzle";
import {
  GroupStudentsTable,
  SessionStudentsTable,
  SessionsTable,
  TraineesTable,
} from "@/drizzle/schema";
import {
  type AttendanceTimes,
  applyJoin,
  applyLeave,
  matchParticipantToTrainee,
  type RosterCandidate,
} from "../lib/attendance-record";
import {
  parseZoomSessionEvent,
  type ZoomSessionEvent,
} from "../lib/webhook-events";

export type ZoomWebhookOutcome =
  | { status: "ignored"; reason: IgnoredReason }
  | { status: "session-updated"; sessionId: string }
  | { status: "attendance-recorded"; sessionId: string; traineeId: string }
  | { status: "recording-attached"; sessionId: string };

type IgnoredReason =
  /** An event this app doesn't act on, or one Zoom shaped unexpectedly. */
  | "unhandled-event"
  /** A meeting no session points at — deleted since, or another app's. */
  | "unknown-meeting"
  /** Nobody on the roster could be identified as this participant. */
  | "unmatched-participant";

type SessionRef = {
  id: string;
  organizationId: string;
  groupId: string;
};

/**
 * Applies one verified Zoom delivery to the class it belongs to.
 *
 * Runs from Inngest, not from the webhook request, so it uses the module-level
 * `db` rather than a tRPC context. There is no caller identity to scope by
 * either: the tenant is derived from the session that owns the meeting, which
 * is the only way the delivery is tied to an organization at all.
 */
export async function applyZoomWebhookEvent(
  eventName: string,
  payload: unknown,
  receivedAt = new Date(),
): Promise<ZoomWebhookOutcome> {
  const event = parseZoomSessionEvent(eventName, payload, receivedAt);
  if (!event) return { status: "ignored", reason: "unhandled-event" };

  const session = await findSessionByMeetingId(event.meetingId);
  if (!session) return { status: "ignored", reason: "unknown-meeting" };

  switch (event.kind) {
    case "meeting-started":
      return startSession(session);
    case "meeting-ended":
      return endSession(session);
    case "participant-joined":
    case "participant-left":
      return recordParticipant(session, event);
    case "recording-completed":
      return attachRecording(session, event.shareUrl, event.password);
  }
}

/**
 * Zoom meeting numbers are unique across Zoom, so at most one session should
 * ever match. The order and limit are there so a row left behind by an
 * unfinished re-provisioning can't make the result depend on the scan.
 */
async function findSessionByMeetingId(
  meetingId: string,
): Promise<SessionRef | undefined> {
  const [session] = await db
    .select({
      id: SessionsTable.id,
      organizationId: SessionsTable.organizationId,
      groupId: SessionsTable.groupId,
    })
    .from(SessionsTable)
    .where(eq(SessionsTable.zoomMeetingId, meetingId))
    .orderBy(sql`${SessionsTable.createdAt} desc`, SessionsTable.id)
    .limit(1);

  return session;
}

/**
 * A meeting that has begun makes its class ongoing — but only from
 * `scheduled`. A class someone already completed or cancelled is not reopened
 * by a stray redelivery.
 */
async function startSession(session: SessionRef): Promise<ZoomWebhookOutcome> {
  await db
    .update(SessionsTable)
    .set({ status: "ongoing" })
    .where(
      and(
        eq(SessionsTable.id, session.id),
        eq(SessionsTable.status, "scheduled"),
      ),
    );

  return { status: "session-updated", sessionId: session.id };
}

/**
 * The meeting is over: the class is complete, and everyone on the roster with
 * nothing recorded was absent.
 *
 * That last step is what makes the register whole without a teacher having to
 * fill it in — silence during the class is the evidence, and anyone Zoom
 * couldn't identify can still be corrected afterwards.
 */
async function endSession(session: SessionRef): Promise<ZoomWebhookOutcome> {
  await db
    .update(SessionsTable)
    .set({ status: "completed" })
    .where(
      and(
        eq(SessionsTable.id, session.id),
        inArray(SessionsTable.status, ["scheduled", "ongoing"]),
      ),
    );

  const roster = await loadRoster(session);

  if (roster.length > 0) {
    await db
      .insert(SessionStudentsTable)
      .values(
        roster.map((candidate) => ({
          organizationId: session.organizationId,
          sessionId: session.id,
          traineeId: candidate.traineeId,
          status: "absent" as const,
          source: "zoom" as const,
        })),
      )
      // Whoever already has a record keeps it — including a teacher's manual
      // one, which this must never overwrite.
      .onConflictDoNothing({
        target: [
          SessionStudentsTable.sessionId,
          SessionStudentsTable.traineeId,
        ],
      });
  }

  return { status: "session-updated", sessionId: session.id };
}

async function recordParticipant(
  session: SessionRef,
  event: Extract<
    ZoomSessionEvent,
    { kind: "participant-joined" | "participant-left" }
  >,
): Promise<ZoomWebhookOutcome> {
  const roster = await loadRoster(session);
  const traineeId = matchParticipantToTrainee(event.participant, roster);

  if (!traineeId) {
    // Deliberately not an error: guests, a teacher's own connection, and
    // anyone joining under a name the roster doesn't carry all land here, and
    // none of them is a failure worth retrying.
    return { status: "ignored", reason: "unmatched-participant" };
  }

  await db.transaction(async (trx) => {
    // Join and leave events for one class arrive in bursts and out of order.
    // The fold below is read-modify-write, so it is serialized per session —
    // the same idiom the meeting provisioning uses (STATE.md D106).
    await trx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${session.id}, 0))`,
    );

    const [existing] = await trx
      .select({
        joinedAt: SessionStudentsTable.joinedAt,
        leftAt: SessionStudentsTable.leftAt,
        attendedMinutes: SessionStudentsTable.attendedMinutes,
        source: SessionStudentsTable.source,
      })
      .from(SessionStudentsTable)
      .where(
        and(
          eq(SessionStudentsTable.sessionId, session.id),
          eq(SessionStudentsTable.traineeId, traineeId),
        ),
      );

    const current: AttendanceTimes | null = existing
      ? {
          joinedAt: existing.joinedAt,
          leftAt: existing.leftAt,
          attendedMinutes: existing.attendedMinutes,
        }
      : null;

    const times =
      event.kind === "participant-joined"
        ? applyJoin(current, event.joinedAt)
        : applyLeave(current, event.leftAt);

    // A teacher's correction outranks what Zoom saw. The times are still
    // recorded — they are evidence either way — but the verdict stays theirs.
    const status =
      existing?.source === "manual" ? undefined : ("present" as const);

    if (!existing) {
      await trx.insert(SessionStudentsTable).values({
        organizationId: session.organizationId,
        sessionId: session.id,
        traineeId,
        status: "present",
        source: "zoom",
        ...times,
      });
      return;
    }

    await trx
      .update(SessionStudentsTable)
      .set({ ...times, ...(status ? { status } : {}), updatedAt: new Date() })
      .where(
        and(
          eq(SessionStudentsTable.sessionId, session.id),
          eq(SessionStudentsTable.traineeId, traineeId),
        ),
      );
  });

  return { status: "attendance-recorded", sessionId: session.id, traineeId };
}

/**
 * Zoom hands over a share link once the cloud recording is processed, which
 * can be long after the class. Stored as-is, links only — the file itself
 * stays in the org's own Zoom account (D8: recording happens in Zoom).
 */
async function attachRecording(
  session: SessionRef,
  shareUrl: string,
  password: string | null,
): Promise<ZoomWebhookOutcome> {
  await db
    .update(SessionsTable)
    .set({ zoomRecordingUrl: shareUrl, zoomRecordingPassword: password })
    .where(eq(SessionsTable.id, session.id));

  return { status: "recording-attached", sessionId: session.id };
}

async function loadRoster(session: SessionRef): Promise<RosterCandidate[]> {
  return db
    .select({
      traineeId: TraineesTable.id,
      email: TraineesTable.email,
      name: TraineesTable.name,
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
        eq(GroupStudentsTable.organizationId, session.organizationId),
        eq(GroupStudentsTable.groupId, session.groupId),
      ),
    );
}
