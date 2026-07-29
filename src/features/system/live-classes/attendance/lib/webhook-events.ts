import { z } from "zod";

/**
 * A Zoom webhook delivery, reduced to the events this app acts on.
 *
 * Zoom sends far more than these; anything else parses to `null` and is
 * acknowledged without work, so an account that starts emitting new event
 * types can never fail a delivery.
 */
export type ZoomSessionEvent =
  | { kind: "meeting-started"; meetingId: string }
  | { kind: "meeting-ended"; meetingId: string }
  | {
      kind: "participant-joined";
      meetingId: string;
      participant: ZoomParticipant;
      joinedAt: Date;
    }
  | {
      kind: "participant-left";
      meetingId: string;
      participant: ZoomParticipant;
      leftAt: Date;
    }
  | {
      kind: "recording-completed";
      meetingId: string;
      shareUrl: string;
      password: string | null;
    };

export type ZoomParticipant = {
  /** Empty for a guest who joined without signing in to Zoom. */
  email: string | null;
  /** The display name they typed into the join dialog. */
  name: string | null;
};

// The meeting number arrives as a JSON number on some events and a string on
// others; it is an identifier either way, and the column holds text.
const meetingObjectSchema = z.object({
  id: z.union([z.number(), z.string()]),
});

const participantSchema = z.object({
  email: z.string().optional(),
  user_name: z.string().optional(),
  join_time: z.string().optional(),
  leave_time: z.string().optional(),
});

const participantEventSchema = z.object({
  object: meetingObjectSchema.extend({ participant: participantSchema }),
});

const meetingEventSchema = z.object({ object: meetingObjectSchema });

const recordingEventSchema = z.object({
  object: meetingObjectSchema.extend({
    share_url: z.string().min(1),
    password: z.string().optional(),
  }),
});

/**
 * Turns one verified delivery into an event this app understands, or `null`
 * when there is nothing to do.
 *
 * Malformed payloads are `null` too rather than a throw: a delivery Zoom
 * shaped differently than expected is not something a retry fixes, and the
 * only alternative is a retry loop against a payload that will never parse.
 */
export function parseZoomSessionEvent(
  event: string,
  payload: unknown,
  /** Falls back to the delivery time when Zoom omits a join/leave stamp. */
  receivedAt: Date = new Date(),
): ZoomSessionEvent | null {
  switch (event) {
    case "meeting.started": {
      const parsed = meetingEventSchema.safeParse(payload);
      if (!parsed.success) return null;
      return { kind: "meeting-started", meetingId: toMeetingId(parsed.data) };
    }
    case "meeting.ended": {
      const parsed = meetingEventSchema.safeParse(payload);
      if (!parsed.success) return null;
      return { kind: "meeting-ended", meetingId: toMeetingId(parsed.data) };
    }
    case "meeting.participant_joined": {
      const parsed = participantEventSchema.safeParse(payload);
      if (!parsed.success) return null;
      return {
        kind: "participant-joined",
        meetingId: toMeetingId(parsed.data),
        participant: toParticipant(parsed.data.object.participant),
        joinedAt: toDate(parsed.data.object.participant.join_time, receivedAt),
      };
    }
    case "meeting.participant_left": {
      const parsed = participantEventSchema.safeParse(payload);
      if (!parsed.success) return null;
      return {
        kind: "participant-left",
        meetingId: toMeetingId(parsed.data),
        participant: toParticipant(parsed.data.object.participant),
        leftAt: toDate(parsed.data.object.participant.leave_time, receivedAt),
      };
    }
    case "recording.completed": {
      const parsed = recordingEventSchema.safeParse(payload);
      if (!parsed.success) return null;
      return {
        kind: "recording-completed",
        meetingId: toMeetingId(parsed.data),
        shareUrl: parsed.data.object.share_url,
        password: parsed.data.object.password ?? null,
      };
    }
    default:
      return null;
  }
}

function toMeetingId(payload: { object: { id: number | string } }): string {
  return String(payload.object.id);
}

function toParticipant(
  participant: z.infer<typeof participantSchema>,
): ZoomParticipant {
  return {
    email: participant.email?.trim() || null,
    name: participant.user_name?.trim() || null,
  };
}

function toDate(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}
