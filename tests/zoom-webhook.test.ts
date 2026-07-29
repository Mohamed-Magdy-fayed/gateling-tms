import { createHmac } from "node:crypto";
import { describe, expect, test } from "vitest";
import {
  buildUrlValidationResponse,
  verifyZoomWebhookSignature,
  WEBHOOK_TIMESTAMP_TOLERANCE_MS,
  zoomWebhookEnvelopeSchema,
} from "../src/integrations/zoom/webhook";

const SECRET = "zoom-webhook-secret-token";
const NOW = new Date("2026-08-03T15:00:00.000Z");
const RAW_BODY = JSON.stringify({
  event: "meeting.started",
  payload: { object: { id: 87654321 } },
});

/** What Zoom itself computes, reproduced here so the test proves the format. */
function sign(rawBody: string, timestamp: string, secret = SECRET): string {
  return `v0=${createHmac("sha256", secret)
    .update(`v0:${timestamp}:${rawBody}`)
    .digest("hex")}`;
}

function secondsAt(date: Date): string {
  return String(Math.floor(date.getTime() / 1000));
}

describe("verifyZoomWebhookSignature", () => {
  const timestamp = secondsAt(NOW);

  test("accepts a delivery signed with the shared secret", () => {
    expect(
      verifyZoomWebhookSignature({
        secretToken: SECRET,
        signature: sign(RAW_BODY, timestamp),
        timestamp,
        rawBody: RAW_BODY,
        now: NOW,
      }),
    ).toBe(true);
  });

  test("accepts a millisecond timestamp as well as a second one", () => {
    const msTimestamp = String(NOW.getTime());

    expect(
      verifyZoomWebhookSignature({
        secretToken: SECRET,
        signature: sign(RAW_BODY, msTimestamp),
        timestamp: msTimestamp,
        rawBody: RAW_BODY,
        now: NOW,
      }),
    ).toBe(true);
  });

  test("rejects a body that changed after it was signed", () => {
    expect(
      verifyZoomWebhookSignature({
        secretToken: SECRET,
        signature: sign(RAW_BODY, timestamp),
        timestamp,
        rawBody: RAW_BODY.replace("87654321", "11112222"),
        now: NOW,
      }),
    ).toBe(false);
  });

  test("rejects a signature made with a different secret", () => {
    expect(
      verifyZoomWebhookSignature({
        secretToken: SECRET,
        signature: sign(RAW_BODY, timestamp, "someone-elses-secret"),
        timestamp,
        rawBody: RAW_BODY,
        now: NOW,
      }),
    ).toBe(false);
  });

  test("rejects a correctly signed delivery that is too old to still be live", () => {
    // Replay protection: the signature covers the timestamp, so an attacker
    // can't refresh it — the only defence is refusing stale ones.
    const staleAt = new Date(
      NOW.getTime() - WEBHOOK_TIMESTAMP_TOLERANCE_MS - 1000,
    );
    const staleTimestamp = secondsAt(staleAt);

    expect(
      verifyZoomWebhookSignature({
        secretToken: SECRET,
        signature: sign(RAW_BODY, staleTimestamp),
        timestamp: staleTimestamp,
        rawBody: RAW_BODY,
        now: NOW,
      }),
    ).toBe(false);
  });

  test("rejects a delivery with no signature or timestamp header", () => {
    expect(
      verifyZoomWebhookSignature({
        secretToken: SECRET,
        signature: null,
        timestamp,
        rawBody: RAW_BODY,
        now: NOW,
      }),
    ).toBe(false);

    expect(
      verifyZoomWebhookSignature({
        secretToken: SECRET,
        signature: sign(RAW_BODY, timestamp),
        timestamp: null,
        rawBody: RAW_BODY,
        now: NOW,
      }),
    ).toBe(false);
  });

  test("rejects everything when no secret is configured", () => {
    expect(
      verifyZoomWebhookSignature({
        secretToken: "",
        signature: sign(RAW_BODY, timestamp, ""),
        timestamp,
        rawBody: RAW_BODY,
        now: NOW,
      }),
    ).toBe(false);
  });

  test("rejects a timestamp that isn't a number", () => {
    expect(
      verifyZoomWebhookSignature({
        secretToken: SECRET,
        signature: sign(RAW_BODY, "not-a-timestamp"),
        timestamp: "not-a-timestamp",
        rawBody: RAW_BODY,
        now: NOW,
      }),
    ).toBe(false);
  });
});

describe("buildUrlValidationResponse", () => {
  test("answers the challenge with the token hashed under the same secret", () => {
    const response = buildUrlValidationResponse(
      SECRET,
      "qgg8vlvZRS6UYooatFL8Aw",
    );

    expect(response.plainToken).toBe("qgg8vlvZRS6UYooatFL8Aw");
    expect(response.encryptedToken).toBe(
      createHmac("sha256", SECRET)
        .update("qgg8vlvZRS6UYooatFL8Aw")
        .digest("hex"),
    );
  });
});

describe("zoomWebhookEnvelopeSchema", () => {
  test("accepts any payload shape — the event decides what it means", () => {
    const parsed = zoomWebhookEnvelopeSchema.safeParse({
      event: "meeting.ended",
      payload: { object: { id: "123" } },
    });

    expect(parsed.success).toBe(true);
  });

  test("rejects a body with no event name", () => {
    expect(zoomWebhookEnvelopeSchema.safeParse({ payload: {} }).success).toBe(
      false,
    );
  });
});
