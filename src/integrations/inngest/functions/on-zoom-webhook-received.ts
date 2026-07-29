import { eventType } from "inngest";
import { z } from "zod";

import { applyZoomWebhookEvent } from "@/features/system/live-classes/attendance/server";
import { inngest } from "../client";

/**
 * One verified Zoom webhook delivery, handed over by
 * `app/api/webhooks/zoom/route.ts`.
 *
 * The route's whole job is to answer Zoom quickly (it retries anything it
 * doesn't get a prompt 2xx for), so the database work lands here — where a
 * failure is retried on its own schedule and shows up as a visible run
 * instead of a duplicate delivery.
 *
 * The payload travels verbatim rather than pre-interpreted: the meaning of a
 * delivery is decided in one place (`lib/webhook-events.ts`), and a run that
 * has the original body can be replayed after that decision changes.
 */
export const zoomWebhookReceivedEvent = eventType("zoom/webhook-received", {
  schema: z.object({
    event: z.string(),
    payload: z.unknown(),
    /** When the endpoint received it — the fallback for a missing stamp. */
    receivedAt: z.string(),
  }),
});

export const onZoomWebhookReceived = inngest.createFunction(
  { id: "on-zoom-webhook-received", triggers: [zoomWebhookReceivedEvent] },
  async ({ event, step }) =>
    step.run("apply-zoom-webhook-event", () =>
      applyZoomWebhookEvent(
        event.data.event,
        event.data.payload,
        new Date(event.data.receivedAt),
      ),
    ),
);
