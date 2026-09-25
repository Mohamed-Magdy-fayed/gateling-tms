import { db } from "@/drizzle";
import {
  handleMeetingEnded,
  handleParticipantJoined,
} from "@/features/system/live-classes/attendance/server/meetings-webhook";
import { resolveMeetingsWebhookSecret } from "@/features/system/live-classes/sessions/server/meetings-config";
import { createMeetingsWebhookHandler } from "@/integrations/meetings/webhook";

/**
 * Inbound lifecycle events from Gateling Meetings. Point the integration's
 * "Webhook URL" (meetings.gateling.com/settings/integrations) at
 * `https://<this app>/api/meetings-webhook`.
 *
 * Verified here — signature and a five-minute replay window, on the raw body
 * — and processed inline, not queued (STATE.md D181): the Inngest app has
 * never synced in production (D178), and a queued event there is accepted and
 * then silently never run. The work is a few indexed writes, all idempotent,
 * so a Meetings retry after a timeout only repeats a no-op.
 *
 * The secret comes from the settings table, so it is read per delivery: an
 * admin who just pasted a rotated secret must not have to wait for a deploy
 * while Meetings burns through its retries.
 */
export async function POST(request: Request): Promise<Response> {
  const secret = await resolveMeetingsWebhookSecret(db);

  return createMeetingsWebhookHandler({
    secret,
    onDelivery: async (delivery) => {
      const { meeting } = delivery.data;

      // A student walking in is marked present when their name matches the
      // roster. The host is the teacher, not a register entry.
      if (delivery.event === "participant.joined") {
        const { participant } = delivery.data;
        if (!participant || participant.role === "host") return;

        await handleParticipantJoined(
          db,
          meeting,
          participant.name,
          new Date(delivery.data.at ?? delivery.createdAt),
        );
        return;
      }

      if (delivery.event === "meeting.ended") {
        await handleMeetingEnded(db, meeting);
      }

      // `meeting.started` and `participant.left` are acknowledged and
      // dropped — time in the room is settled from the participant log once
      // the room closes.
    },
  })(request);
}
