import type { OrganizationMembershipRole } from "@/drizzle/schema";

export type SessionViewer = {
  userId: string;
  role: OrganizationMembershipRole;
};

export type SessionMeetingColumns = {
  teacherId: string | null;
  joinUrl: string | null;
  startUrl: string | null;
};

export type SessionLinks = {
  /** Everyone in the org gets this one — it joins as a participant. */
  joinUrl: string | null;
  /** Host link, or null when this viewer must not have host rights. */
  startUrl: string | null;
};

/**
 * An onMeeting `start_url` grants host control of the meeting to whoever opens
 * it, so it is not a link that may travel with a session row. Only the teacher
 * the session is assigned to, and org admins (who own the connection itself),
 * ever see it — a teacher who isn't running *this* class gets the participant
 * link like everyone else.
 *
 * The same rule decides who may *start* a class, since starting it is what
 * produces that link in the first place (STATE.md D143).
 */
export function canHostSession(
  viewer: SessionViewer,
  teacherId: string | null,
): boolean {
  return viewer.role === "admin" || viewer.userId === teacherId;
}

export function resolveSessionLinks(
  viewer: SessionViewer,
  session: SessionMeetingColumns,
): SessionLinks {
  return {
    joinUrl: session.joinUrl,
    startUrl: canHostSession(viewer, session.teacherId)
      ? session.startUrl
      : null,
  };
}
