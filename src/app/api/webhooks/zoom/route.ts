import { NextResponse } from "next/server";
import { env } from "@/data/env/server";
import { inngest } from "@/integrations/inngest/client";
import { zoomWebhookReceivedEvent } from "@/integrations/inngest/functions/on-zoom-webhook-received";
import {
  buildUrlValidationResponse,
  verifyZoomWebhookSignature,
  ZOOM_URL_VALIDATION_EVENT,
  zoomUrlValidationPayloadSchema,
  zoomWebhookEnvelopeSchema,
} from "@/integrations/zoom";

/**
 * Zoom's event receiver.
 *
 * Deliberately thin (phase-06.md step 5): verify, acknowledge, hand the work
 * to Inngest. Zoom retries anything it doesn't get a prompt 2xx for, so doing
 * database work here would turn one slow query into a storm of duplicate
 * deliveries — and Inngest gives each event its own retries and a visible run.
 */
export async function POST(request: Request): Promise<Response> {
  const secretToken = env.ZOOM_WEBHOOK_SECRET_TOKEN;

  if (!secretToken) {
    // Nothing can be verified without the secret, so nothing is trusted.
    // 503 rather than 500: the deployment is unconfigured, not broken, and
    // Zoom's retry may well land after the value is added.
    return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  }

  // The signature covers these exact bytes — parsing first and re-serializing
  // would change key order and whitespace and invalidate every delivery.
  const rawBody = await request.text();

  const isAuthentic = verifyZoomWebhookSignature({
    secretToken,
    signature: request.headers.get("x-zm-signature"),
    timestamp: request.headers.get("x-zm-request-timestamp"),
    rawBody,
  });

  if (!isAuthentic) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const envelope = zoomWebhookEnvelopeSchema.safeParse(safeParseJson(rawBody));

  if (!envelope.success) {
    return NextResponse.json({ error: "malformed payload" }, { status: 400 });
  }

  if (envelope.data.event === ZOOM_URL_VALIDATION_EVENT) {
    const payload = zoomUrlValidationPayloadSchema.safeParse(
      envelope.data.payload,
    );

    if (!payload.success) {
      return NextResponse.json({ error: "malformed payload" }, { status: 400 });
    }

    return NextResponse.json(
      buildUrlValidationResponse(secretToken, payload.data.plainToken),
    );
  }

  await inngest.send(
    zoomWebhookReceivedEvent.create({
      event: envelope.data.event,
      payload: envelope.data.payload ?? null,
      receivedAt: new Date().toISOString(),
    }),
  );

  return NextResponse.json({ received: true });
}

function safeParseJson(rawBody: string): unknown {
  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}
