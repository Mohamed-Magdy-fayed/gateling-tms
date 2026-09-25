import { db } from "@/drizzle";
import { resolveMeetingsWebhookSecret } from "@/features/system/live-classes/sessions/server/meetings-config";
import { inngest } from "@/integrations/inngest/client";
import { meetingsParticipantJoinedEvent } from "@/integrations/inngest/functions/on-meetings-participant-joined";
import { meetingsWebhookReceivedEvent } from "@/integrations/inngest/functions/on-meetings-webhook";
import { createMeetingsWebhookHandler } from "@/integrations/meetings/webhook";

/**
 * Inbound lifecycle events from Gateling Meetings. Point the integration's
 * "Webhook URL" (meetings.gateling.com/settings/integrations) at
 * `https://<this app>/api/meetings-webhook`.
 *
 * Verified here — signature and a five-minute replay window, on the raw body
 * — and processed in `on-meetings-webhook`. The handler answers as soon as
 * the event is queued: a slow response is retried by Meetings as if it had
 * failed, and the work itself (a status write) belongs in a job anyway
 * (docs/inngest-offload-policy.md).
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
      // A student walking in is marked present when their name matches the
      // roster. The host is the teacher, not a register entry. `started` and
      // `participant.left` are acknowledged and dropped — time in the room is
      // settled from the participant log once the room closes.
      if (delivery.event === "participant.joined") {
        const { participant } = delivery.data;
        if (!participant || participant.role === "host") return;

        await inngest.send({
          ...meetingsParticipantJoinedEvent.create({
            deliveryId: delivery.id,
            meeting: {
              code: delivery.data.meeting.code,
              externalRef: delivery.data.meeting.externalRef,
            },
            participant: { name: participant.name },
            at: delivery.data.at ?? delivery.createdAt,
          }),
          id: delivery.id,
        });
        return;
      }

      if (delivery.event !== "meeting.ended") return;

      await inngest.send({
        ...meetingsWebhookReceivedEvent.create({
          deliveryId: delivery.id,
          event: delivery.event,
          meeting: {
            code: delivery.data.meeting.code,
            externalRef: delivery.data.meeting.externalRef,
            endedAt: delivery.data.meeting.endedAt,
          },
          endedBy: delivery.data.endedBy,
        }),
        // The delivery id is stable across Meetings' retries, and Inngest
        // deduplicates on it — one room closing runs the function once.
        id: delivery.id,
      });
    },
  })(request);
}
