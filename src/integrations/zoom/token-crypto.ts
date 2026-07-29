import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const PART_SEPARATOR = ".";

export class ZoomTokenKeyError extends Error {}
export class ZoomTokenCipherError extends Error {}

/**
 * Zoom OAuth tokens are long-lived credentials for someone else's Zoom
 * account, so they are encrypted before they reach the database rather than
 * stored the way SOURCE stored them (plain `varchar`). AES-256-GCM is
 * authenticated, so a tampered ciphertext fails to decrypt instead of
 * yielding garbage that would then be sent to Zoom.
 *
 * The key is a parameter rather than read from `env` here so this module
 * stays pure and unit-testable; `server/zoom-config.ts` resolves the real one.
 */
export function encryptToken(plaintext: string, keyBase64: string): string {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, parseKey(keyBase64), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  return [iv, cipher.getAuthTag(), ciphertext]
    .map((part) => part.toString("base64"))
    .join(PART_SEPARATOR);
}

export function decryptToken(payload: string, keyBase64: string): string {
  const parts = payload.split(PART_SEPARATOR);
  if (parts.length !== 3) {
    throw new ZoomTokenCipherError("Malformed encrypted token.");
  }

  const [iv, authTag, ciphertext] = parts.map((part) =>
    Buffer.from(part, "base64"),
  );

  if (iv.length !== IV_BYTES || authTag.length !== AUTH_TAG_BYTES) {
    throw new ZoomTokenCipherError("Malformed encrypted token.");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, parseKey(keyBase64), iv);
  decipher.setAuthTag(authTag);

  try {
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    // Either the ciphertext was tampered with or the key was rotated —
    // both mean "re-connect this Zoom account", never "use it anyway".
    throw new ZoomTokenCipherError("Encrypted token failed authentication.");
  }
}

function parseKey(keyBase64: string): Buffer {
  const key = Buffer.from(keyBase64, "base64");
  if (key.length !== KEY_BYTES) {
    throw new ZoomTokenKeyError(
      `ZOOM_TOKEN_ENCRYPTION_KEY must be ${KEY_BYTES} base64-encoded bytes.`,
    );
  }
  return key;
}
