import crypto from "node:crypto";
import { describe, expect, test } from "vitest";
import {
  decryptToken,
  encryptToken,
  ZoomTokenCipherError,
  ZoomTokenKeyError,
} from "../src/integrations/zoom/token-crypto";

const key = crypto.randomBytes(32).toString("base64");
const otherKey = crypto.randomBytes(32).toString("base64");

describe("zoom token encryption", () => {
  test("round-trips a token through encrypt and decrypt", () => {
    const token = "v2.abc123.refresh-token-value";

    expect(decryptToken(encryptToken(token, key), key)).toBe(token);
  });

  test("never stores the plaintext in the ciphertext payload", () => {
    const token = "super-secret-refresh-token";

    expect(encryptToken(token, key)).not.toContain(token);
  });

  test("produces a different ciphertext each time for the same token", () => {
    const token = "same-token-twice";

    // A fresh random IV per call — identical tokens must not be recognizable
    // as identical from the stored rows alone.
    expect(encryptToken(token, key)).not.toBe(encryptToken(token, key));
  });

  test("rejects a token encrypted under a different key", () => {
    const payload = encryptToken("token", otherKey);

    expect(() => decryptToken(payload, key)).toThrow(ZoomTokenCipherError);
  });

  test("rejects a tampered ciphertext instead of returning garbage", () => {
    const [iv, authTag, ciphertext] = encryptToken("token", key).split(".");
    const flipped = Buffer.from(ciphertext, "base64");
    flipped[0] ^= 0xff;
    const tampered = [iv, authTag, flipped.toString("base64")].join(".");

    expect(() => decryptToken(tampered, key)).toThrow(ZoomTokenCipherError);
  });

  test("rejects a payload that isn't three parts", () => {
    expect(() => decryptToken("not-a-payload", key)).toThrow(
      ZoomTokenCipherError,
    );
  });

  test("rejects a payload whose iv is the wrong length", () => {
    const parts = encryptToken("token", key).split(".");
    const shortIv = Buffer.alloc(8).toString("base64");

    expect(() =>
      decryptToken([shortIv, parts[1], parts[2]].join("."), key),
    ).toThrow(ZoomTokenCipherError);
  });

  test("rejects a key that isn't 32 bytes", () => {
    const shortKey = crypto.randomBytes(16).toString("base64");

    expect(() => encryptToken("token", shortKey)).toThrow(ZoomTokenKeyError);
  });
});
