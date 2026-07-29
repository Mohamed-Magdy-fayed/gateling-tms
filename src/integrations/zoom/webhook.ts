import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

/**
 * How stale a request may be before it is refused. Zoom signs the timestamp it
 * sends, so an attacker can't move it — but without a bound, a signed request
 * captured once could be replayed forever.
 */
export const WEBHOOK_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

const SIGNATURE_PREFIX = "v0=";

/** Zoom wraps every event in the same envelope; only `payload` varies. */
export const zoomWebhookEnvelopeSchema = z.object({
  event: z.string().min(1),
  payload: z.unknown(),
});

export type ZoomWebhookEnvelope = z.infer<typeof zoomWebhookEnvelopeSchema>;

export const zoomUrlValidationPayloadSchema = z.object({
  plainToken: z.string().min(1),
});

export const ZOOM_URL_VALIDATION_EVENT = "endpoint.url_validation";

type SignatureCheck = {
  secretToken: string;
  signature: string | null;
  timestamp: string | null;
  /**
   * The bytes Zoom actually signed. Re-serializing the parsed JSON would
   * change key order and whitespace and break every signature, so callers must
   * pass the untouched request body.
   */
  rawBody: string;
  now?: Date;
};

/**
 * Whether a request really came from Zoom and is recent enough to act on.
 *
 * Fails closed on every missing part: no header, no secret, unparseable
 * timestamp, or a digest of a different length all answer `false` rather than
 * throwing, because the caller's only reachable response either way is 401.
 */
export function verifyZoomWebhookSignature({
  secretToken,
  signature,
  timestamp,
  rawBody,
  now = new Date(),
}: SignatureCheck): boolean {
  if (!secretToken || !signature || !timestamp) return false;
  if (!isFreshTimestamp(timestamp, now)) return false;

  const expected = `${SIGNATURE_PREFIX}${createHmac("sha256", secretToken)
    .update(`v0:${timestamp}:${rawBody}`)
    .digest("hex")}`;

  return equalsInConstantTime(signature, expected);
}

/**
 * Zoom proves it owns the endpoint by sending a token that must come back
 * hashed with the same secret. Answering this is what turns a webhook
 * subscription on, so it is handled inline in the route rather than offloaded.
 */
export function buildUrlValidationResponse(
  secretToken: string,
  plainToken: string,
): { plainToken: string; encryptedToken: string } {
  return {
    plainToken,
    encryptedToken: createHmac("sha256", secretToken)
      .update(plainToken)
      .digest("hex"),
  };
}

/**
 * Zoom documents `x-zm-request-timestamp` as a Unix timestamp without stating
 * the unit, and has been observed sending both. Guessing wrong would reject
 * every delivery, so the magnitude decides: anything below the year-2286
 * seconds ceiling is read as seconds.
 */
function isFreshTimestamp(timestamp: string, now: Date): boolean {
  const value = Number(timestamp);
  if (!Number.isFinite(value) || value <= 0) return false;

  const sentAtMs = value < 1e12 ? value * 1000 : value;

  return Math.abs(now.getTime() - sentAtMs) <= WEBHOOK_TIMESTAMP_TOLERANCE_MS;
}

function equalsInConstantTime(actual: string, expected: string): boolean {
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);

  // timingSafeEqual throws on a length mismatch, which would itself leak the
  // digest length — a plain comparison of lengths first is what the crypto
  // docs prescribe.
  if (actualBytes.length !== expectedBytes.length) return false;

  return timingSafeEqual(actualBytes, expectedBytes);
}
