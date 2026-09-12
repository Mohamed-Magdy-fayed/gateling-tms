/**
 * How a class session and its Gateling Meetings room refer to each other —
 * pure, so both the request path (start a class) and the webhook path (a
 * meeting ended) agree on it without either importing the other.
 */

const SESSION_EXTERNAL_REF_PREFIX = "session:";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Meetings' `externalRef` for a session — this app's own handle on the
 * meeting, searchable there and echoed back on every webhook delivery.
 */
export function buildSessionExternalRef(sessionId: string): string {
  return `${SESSION_EXTERNAL_REF_PREFIX}${sessionId}`;
}

/**
 * The session id inside an `externalRef`, or null when the ref isn't one of
 * ours. A webhook receiver can't assume every meeting on the integration
 * belongs to a session — another handle shape, or a hand-made meeting, must
 * be ignored rather than parsed into garbage and looked up.
 */
export function parseSessionExternalRef(
  externalRef: string | null | undefined,
): string | null {
  if (!externalRef?.startsWith(SESSION_EXTERNAL_REF_PREFIX)) return null;
  const sessionId = externalRef.slice(SESSION_EXTERNAL_REF_PREFIX.length);
  return UUID_PATTERN.test(sessionId) ? sessionId : null;
}

/**
 * Idempotency key for creating a session's meeting. Two hosts pressing
 * "Start class" at once, or one host's retried request, both carry the same
 * key, and Meetings hands back the same meeting for it — no advisory lock
 * needed on this side.
 */
export function sessionMeetingIdempotencyKey(sessionId: string): string {
  return `${buildSessionExternalRef(sessionId)}:meeting`;
}

const MEETING_TITLE_MAX_LENGTH = 200;

/**
 * What the meeting is called on Meetings' side. The group name plus the date
 * is what a host scanning their Meetings dashboard needs to tell one class
 * from the next; the session id would be precise and useless to a human.
 */
export function buildMeetingTitle(
  groupName: string,
  scheduledAt: Date,
): string {
  const date = scheduledAt.toISOString().slice(0, 10);
  return `${groupName} — ${date}`.slice(0, MEETING_TITLE_MAX_LENGTH);
}

/**
 * Whose account hosts the class. The assigned teacher when there is one — an
 * admin starting a class a minute before the teacher arrives must not end up
 * holding the room's controls instead of them — and otherwise whoever is
 * starting it, who `canHostSession` already guarantees is an admin.
 */
export function resolveMeetingHostUserId(
  teacherId: string | null,
  starterUserId: string,
): string {
  return teacherId ?? starterUserId;
}
