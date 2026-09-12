import type { OrganizationMembershipRole } from "@/drizzle/schema";

export type SessionViewer = {
  userId: string;
  role: OrganizationMembershipRole;
};

/**
 * Who may *start* a class — which is what creates its meeting and fixes who
 * hosts it (STATE.md D143). The teacher the session is assigned to, and org
 * admins (who own the schedule itself). A teacher who isn't running *this*
 * class joins it like everyone else.
 */
export function canHostSession(
  viewer: SessionViewer,
  teacherId: string | null,
): boolean {
  return viewer.role === "admin" || viewer.userId === teacherId;
}

/**
 * Whether this viewer holds host rights on the meeting that already exists.
 *
 * Distinct from `canHostSession`: Gateling Meetings binds host control to one
 * identity — the `meetingHostUserId` recorded when the class was started —
 * and issues a host link to nobody else (a request for one answers 403). An
 * admin who didn't start the class therefore joins it as a participant; they
 * still see everything, they just don't hold the room's controls.
 */
export function isMeetingHost(
  viewer: Pick<SessionViewer, "userId">,
  meetingHostUserId: string | null,
): boolean {
  return meetingHostUserId !== null && viewer.userId === meetingHostUserId;
}

/**
 * The in-app link that sends a signed-in member into a session's meeting.
 *
 * Never the meeting's own URL: a host link is single-use and expires within
 * minutes, so it can't be rendered into a page and clicked later. The route
 * behind this path mints one per click and redirects — see
 * `app/(system)/live-classes/sessions/[id]/join/route.ts`.
 */
export function sessionJoinPath(sessionId: string): string {
  return `/live-classes/sessions/${encodeURIComponent(sessionId)}/join`;
}
