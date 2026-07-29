import type { ZoomMeetingRequest } from "@/integrations/zoom";

/** Zoom rejects a create/update whose topic or agenda exceeds these. */
const MAX_TOPIC_LENGTH = 200;
const MAX_AGENDA_LENGTH = 2000;

/** Students can open the room this many minutes early and wait together. */
const JOIN_BEFORE_HOST_MINUTES = 10;

export type SessionMeetingInput = {
  groupName: string;
  /** Null when the group isn't tied to a course — the agenda then omits it. */
  courseName: string | null;
  scheduledAt: Date;
  durationMinutes: number;
  /** The organization's IANA zone, so Zoom shows the academy's local time. */
  timeZone: string;
};

/**
 * Turns one class session into the Zoom meeting body that represents it.
 *
 * One meeting per session, not SOURCE's single recurring meeting per group
 * (type 8 with a `recurrence` block): TARGET's sessions are already
 * individually generated rows that can be rescheduled or cancelled one at a
 * time, and a recurring meeting can't follow that without rewriting the whole
 * series on every edit.
 *
 * `auto_recording` is deliberately absent. SOURCE hard-coded `"cloud"`, which
 * a Zoom account without cloud recording rejects outright — the setting stays
 * whatever the connected account defaults to, so recording is the org's choice
 * and never a reason a class fails to get a meeting.
 */
export function buildSessionMeetingRequest(
  input: SessionMeetingInput,
): ZoomMeetingRequest {
  const agenda = input.courseName
    ? `${input.courseName} — ${input.groupName}`
    : input.groupName;

  return {
    topic: truncate(input.groupName, MAX_TOPIC_LENGTH),
    agenda: truncate(agenda, MAX_AGENDA_LENGTH),
    type: 2,
    start_time: toZoomStartTime(input.scheduledAt),
    duration: input.durationMinutes,
    timezone: input.timeZone,
    settings: {
      host_video: true,
      participant_video: false,
      join_before_host: true,
      jbh_time: JOIN_BEFORE_HOST_MINUTES,
      // A waiting room would leave students stuck outside whenever the
      // teacher is late, which is exactly when joining early matters.
      waiting_room: false,
    },
  };
}

/**
 * `yyyy-MM-ddTHH:mm:ssZ` — Zoom's documented format, which has no
 * milliseconds. The instant is always sent in UTC; the `timezone` field
 * alongside it only decides how Zoom displays the meeting.
 */
export function toZoomStartTime(date: Date): string {
  return `${date.toISOString().slice(0, 19)}Z`;
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max);
}
