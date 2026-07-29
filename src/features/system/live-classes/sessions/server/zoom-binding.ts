import { sql } from "drizzle-orm";
import { SessionsTable, ZoomClientsTable } from "@/drizzle/schema";

/**
 * Whether the Zoom account a session is booked on is still connected.
 *
 * Written as SQL rather than two selected columns because both callers ask the
 * same question of a LEFT JOIN, where "no row at all" has to answer `false`
 * rather than null — a session pointing at a hard-deleted account is exactly
 * as unusable as one pointing at a disconnected one.
 */
export const isUsableZoomClient = sql<boolean>`coalesce(${ZoomClientsTable.status} = 'active' and ${ZoomClientsTable.deletedAt} is null, false)`;

/**
 * Sessions that need a meeting: either they never had one, or the account
 * theirs lives on is gone. Both are re-provisioned the same way.
 */
export const needsZoomMeeting = sql`(${SessionsTable.zoomMeetingId} is null or not ${isUsableZoomClient})`;
