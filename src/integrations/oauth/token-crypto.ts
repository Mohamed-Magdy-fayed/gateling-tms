import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const PART_SEPARATOR = ".";

export class TokenKeyError extends Error {}
export class TokenCipherError extends Error {}

/**
 * Encryption at rest for third-party OAuth tokens — long-lived credentials
 * for someone else's account (a school's Zoom account, a school's Google
 * account), which SOURCE stored as plain `varchar`. AES-256-GCM is
 * authenticated, so a tampered ciphertext fails to decrypt instead of
 * yielding garbage that would then be sent to the provider.
 *
 * The key is a parameter rather than read from `env` here so this module stays
 * pure and unit-testable; each integration's own `config.ts` resolves the real
 * one from its own env var, so rotating one provider's key never touches the
 * other's stored tokens.
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
    throw new TokenCipherError("Malformed encrypted token.");
  }

  const [iv, authTag, ciphertext] = parts.map((part) =>
    Buffer.from(part, "base64"),
  );

  if (iv.length !== IV_BYTES || authTag.length !== AUTH_TAG_BYTES) {
    throw new TokenCipherError("Malformed encrypted token.");
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
    // both mean "re-connect this account", never "use it anyway".
    throw new TokenCipherError("Encrypted token failed authentication.");
  }
}

function parseKey(keyBase64: string): Buffer {
  const key = Buffer.from(keyBase64, "base64");
  if (key.length !== KEY_BYTES) {
    throw new TokenKeyError(
      `A token encryption key must be ${KEY_BYTES} base64-encoded bytes.`,
    );
  }
  return key;
}
