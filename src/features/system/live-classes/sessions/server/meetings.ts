import { and, asc, eq, gt, isNotNull, isNull, lt, ne, sql } from "drizzle-orm";
import { db } from "@/drizzle";
import {
  CoursesTable,
  GroupsTable,
  OrganizationsTable,
  SessionsTable,
  ZoomClientsTable,
} from "@/drizzle/schema";
import { getValidZoomAccessToken } from "@/features/system/live-classes/zoom-clients/server";
import {
  createZoomMeeting,
  deleteZoomMeeting,
  updateZoomMeeting,
} from "@/integrations/zoom";
import { buildSessionMeetingRequest } from "../lib/meeting-request";
import {
  selectAvailableZoomClient,
  sessionEndsAt,
} from "../lib/meeting-window";
import { isUsableZoomClient } from "./zoom-binding";

export type SessionMeetingSyncResult =
  | { status: "created"; zoomMeetingId: string }
  | { status: "updated"; zoomMeetingId: string }
  /** No connected Zoom account was free — the session stays offline. */
  | { status: "offline" }
  /** Gone, cancelled, or already in the past: nothing to provision. */
  | { status: "skipped" }
  /** A concurrent run won the race and its meeting is the one that counts. */
  | { status: "superseded" };

type ZoomClientReservation =
  | { status: "reserved"; zoomClientId: string }
  | { status: "offline" }
  | { status: "superseded" };

/**
 * Makes the Zoom meeting for one session match the session.
 *
 * Called from Inngest for every session a schedule change touched, so it has
 * to be safe to run repeatedly and out of order: it creates a meeting only
 * when the row has none, and otherwise pushes the current time/duration to
 * the meeting it already has.
 */
export async function syncSessionMeeting({
  organizationId,
  sessionId,
  now = new Date(),
}: {
  organizationId: string;
  sessionId: string;
  now?: Date;
}): Promise<SessionMeetingSyncResult> {
  const session = await loadSession(organizationId, sessionId);

  // Deleted between the event and this run, cancelled since, or already in
  // the past — a retry will never make any of those provisionable.
  if (
    !session ||
    session.status === "cancelled" ||
    session.scheduledAt.getTime() <= now.getTime()
  ) {
    return { status: "skipped" };
  }

  const request = buildSessionMeetingRequest({
    groupName: session.groupName,
    courseName: session.courseName,
    scheduledAt: session.scheduledAt,
    durationMinutes: session.durationMinutes,
    timeZone: session.timeZone,
  });

  if (session.zoomClientId && session.zoomMeetingId) {
    if (session.isZoomClientUsable) {
      const accessToken = await getValidZoomAccessToken(
        organizationId,
        session.zoomClientId,
      );
      // Pushed unconditionally rather than diffed: the row doesn't record what
      // Zoom was last told, and one PATCH per touched session is cheaper than
      // storing and reconciling a second copy of the schedule.
      await updateZoomMeeting(accessToken, session.zoomMeetingId, request);
      return { status: "updated", zoomMeetingId: session.zoomMeetingId };
    }

    // The account this session was booked on has been disconnected. Its
    // links can't be maintained any more, and leaving them in place would
    // strand the class on a dead meeting with nothing in the UI able to fix
    // it — so the binding is released and the session re-provisioned below,
    // onto another connected account if the org has one.
    await releaseStaleMeeting(organizationId, sessionId, session.zoomClientId);
  }

  const reservation = await reserveZoomClient(organizationId, {
    sessionId,
    scheduledAt: session.scheduledAt,
    durationMinutes: session.durationMinutes,
  });

  if (reservation.status !== "reserved") return reservation;

  const { zoomClientId } = reservation;
  const accessToken = await getValidZoomAccessToken(
    organizationId,
    zoomClientId,
  );
  const meeting = await createZoomMeeting(accessToken, request);

  // Guarded on the reservation this run made: anything that released or
  // replaced it in the meantime means this meeting is the stale one, so it is
  // deleted rather than left orphaned in the account.
  const [claimed] = await db
    .update(SessionsTable)
    .set({
      zoomMeetingId: meeting.meetingId,
      zoomMeetingPassword: meeting.password,
      zoomJoinUrl: meeting.joinUrl,
      zoomStartUrl: meeting.startUrl,
    })
    .where(
      and(
        eq(SessionsTable.id, sessionId),
        eq(SessionsTable.organizationId, organizationId),
        eq(SessionsTable.zoomClientId, zoomClientId),
        isNull(SessionsTable.zoomMeetingId),
      ),
    )
    .returning({ id: SessionsTable.id });

  if (!claimed) {
    await deleteZoomMeeting(accessToken, meeting.meetingId);
    return { status: "superseded" };
  }

  return { status: "created", zoomMeetingId: meeting.meetingId };
}

/**
 * Removes a meeting whose session is gone. The ids travel in the event
 * payload because the row they came from has already been deleted by the time
 * this runs.
 */
export async function cancelSessionMeeting({
  organizationId,
  zoomClientId,
  zoomMeetingId,
}: {
  organizationId: string;
  zoomClientId: string;
  zoomMeetingId: string;
}): Promise<void> {
  const accessToken = await getValidZoomAccessToken(
    organizationId,
    zoomClientId,
  );
  await deleteZoomMeeting(accessToken, zoomMeetingId);
}

async function loadSession(organizationId: string, sessionId: string) {
  const [session] = await db
    .select({
      scheduledAt: SessionsTable.scheduledAt,
      durationMinutes: SessionsTable.durationMinutes,
      status: SessionsTable.status,
      zoomClientId: SessionsTable.zoomClientId,
      zoomMeetingId: SessionsTable.zoomMeetingId,
      // Whether the account this session is booked on is still connected —
      // a disconnected one can't maintain the meeting any more.
      isZoomClientUsable: isUsableZoomClient,
      groupName: GroupsTable.name,
      courseName: CoursesTable.name,
      timeZone: OrganizationsTable.timeZone,
    })
    .from(SessionsTable)
    .innerJoin(
      GroupsTable,
      and(
        eq(GroupsTable.id, SessionsTable.groupId),
        eq(GroupsTable.organizationId, SessionsTable.organizationId),
      ),
    )
    .innerJoin(
      OrganizationsTable,
      eq(OrganizationsTable.id, SessionsTable.organizationId),
    )
    .leftJoin(CoursesTable, eq(CoursesTable.id, GroupsTable.courseId))
    .leftJoin(
      ZoomClientsTable,
      and(
        eq(ZoomClientsTable.id, SessionsTable.zoomClientId),
        eq(ZoomClientsTable.organizationId, SessionsTable.organizationId),
      ),
    )
    .where(
      and(
        eq(SessionsTable.id, sessionId),
        eq(SessionsTable.organizationId, organizationId),
      ),
    );

  return session;
}

/**
 * Drops the meeting a disconnected account left behind, guarded on that exact
 * account so a concurrent run that already re-provisioned the session can't
 * have its fresh links wiped.
 */
async function releaseStaleMeeting(
  organizationId: string,
  sessionId: string,
  staleZoomClientId: string,
) {
  await db
    .update(SessionsTable)
    .set({
      zoomClientId: null,
      zoomMeetingId: null,
      zoomMeetingPassword: null,
      zoomJoinUrl: null,
      zoomStartUrl: null,
    })
    .where(
      and(
        eq(SessionsTable.id, sessionId),
        eq(SessionsTable.organizationId, organizationId),
        eq(SessionsTable.zoomClientId, staleZoomClientId),
      ),
    );
}

/**
 * Picks the account this session will be hosted on and writes that choice to
 * the row, before any meeting exists.
 *
 * Choosing and recording have to be one atomic step. A Zoom user can only host
 * one meeting at a time, and two jobs provisioning two overlapping sessions
 * would otherwise both read "account A is free", both create a meeting on it,
 * and both succeed — each claim only guards its own row. Read Committed
 * doesn't stop that (the conflict is a row neither transaction has written
 * yet), so the selection runs under an advisory lock keyed on the
 * organization; the reservation the winner writes is what the loser then sees
 * as busy.
 *
 * The lock covers database work only — never the call to Zoom. Holding it
 * across an external request would tie up a pooled connection per waiting job
 * and could exhaust the pool with everyone blocked on the lock holder.
 *
 * A reservation with no meeting behind it (crash, or a Zoom error after this
 * commits) is self-healing: the row still counts as awaiting a meeting, and
 * the retry re-reserves and tries again.
 */
async function reserveZoomClient(
  organizationId: string,
  session: { sessionId: string; scheduledAt: Date; durationMinutes: number },
): Promise<ZoomClientReservation> {
  return db.transaction(async (trx) => {
    await trx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${organizationId}, 0))`,
    );

    const clients = await trx
      .select({ id: ZoomClientsTable.id })
      .from(ZoomClientsTable)
      .where(
        and(
          eq(ZoomClientsTable.organizationId, organizationId),
          eq(ZoomClientsTable.status, "active"),
          isNull(ZoomClientsTable.deletedAt),
        ),
      )
      .orderBy(asc(ZoomClientsTable.createdAt), asc(ZoomClientsTable.id));

    if (clients.length === 0) return { status: "offline" };

    const endsAt = sessionEndsAt(session.scheduledAt, session.durationMinutes);

    // Every session already pointing at an account counts as busy, meeting or
    // not — a reservation is a booking even before Zoom has been called.
    const busy = await trx
      .selectDistinct({ zoomClientId: SessionsTable.zoomClientId })
      .from(SessionsTable)
      .where(
        and(
          eq(SessionsTable.organizationId, organizationId),
          isNotNull(SessionsTable.zoomClientId),
          ne(SessionsTable.id, session.sessionId),
          ne(SessionsTable.status, "cancelled"),
          // Half-open overlap: a class starting exactly when another ends is
          // not a clash.
          lt(SessionsTable.scheduledAt, endsAt),
          gt(
            sql`${SessionsTable.scheduledAt} + (${SessionsTable.durationMinutes} * interval '1 minute')`,
            session.scheduledAt,
          ),
        ),
      );

    const zoomClientId = selectAvailableZoomClient(
      clients.map((client) => client.id),
      busy
        .map((row) => row.zoomClientId)
        .filter((id): id is string => id !== null),
    );

    if (!zoomClientId) return { status: "offline" };

    const [reserved] = await trx
      .update(SessionsTable)
      .set({ zoomClientId })
      .where(
        and(
          eq(SessionsTable.id, session.sessionId),
          eq(SessionsTable.organizationId, organizationId),
          // Something provisioned this session while the lock was being
          // waited on; that meeting stands.
          isNull(SessionsTable.zoomMeetingId),
        ),
      )
      .returning({ id: SessionsTable.id });

    return reserved
      ? { status: "reserved", zoomClientId }
      : { status: "superseded" };
  });
}
