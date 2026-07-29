import {
  and,
  asc,
  eq,
  gt,
  isNotNull,
  isNull,
  lt,
  ne,
  sql,
} from "drizzle-orm";
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

export type SessionMeetingSyncResult =
  | { status: "created"; zoomMeetingId: string }
  | { status: "updated"; zoomMeetingId: string }
  /** No connected Zoom account was free — the session stays offline. */
  | { status: "offline" }
  /** Gone, cancelled, or already in the past: nothing to provision. */
  | { status: "skipped" }
  /** A concurrent run won the race and its meeting is the one that counts. */
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

  const zoomClientId = await selectZoomClientForSession(organizationId, {
    sessionId,
    scheduledAt: session.scheduledAt,
    durationMinutes: session.durationMinutes,
  });

  if (!zoomClientId) return { status: "offline" };

  const accessToken = await getValidZoomAccessToken(
    organizationId,
    zoomClientId,
  );
  const meeting = await createZoomMeeting(accessToken, request);

  // The guard is the write itself: two concurrent runs can both reach Zoom,
  // but only one can claim a row that still has no meeting. The loser deletes
  // the meeting it just made instead of leaving it orphaned in the account.
  const [claimed] = await db
    .update(SessionsTable)
    .set({
      zoomClientId,
      zoomMeetingId: meeting.meetingId,
      zoomMeetingPassword: meeting.password,
      zoomJoinUrl: meeting.joinUrl,
      zoomStartUrl: meeting.startUrl,
    })
    .where(
      and(
        eq(SessionsTable.id, sessionId),
        eq(SessionsTable.organizationId, organizationId),
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
    .where(
      and(
        eq(SessionsTable.id, sessionId),
        eq(SessionsTable.organizationId, organizationId),
      ),
    );

  return session;
}

/**
 * Connected accounts, oldest first, minus the ones already hosting something
 * that overlaps this session — a Zoom user can only host one meeting at a
 * time (SOURCE's `getAvailableZoomClient` solved the same problem).
 */
async function selectZoomClientForSession(
  organizationId: string,
  session: { sessionId: string; scheduledAt: Date; durationMinutes: number },
): Promise<string | null> {
  const clients = await db
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

  if (clients.length === 0) return null;

  const endsAt = sessionEndsAt(session.scheduledAt, session.durationMinutes);

  const busy = await db
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

  return selectAvailableZoomClient(
    clients.map((client) => client.id),
    busy
      .map((row) => row.zoomClientId)
      .filter((id): id is string => id !== null),
  );
}
