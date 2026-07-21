import { describe, expect, test } from "vitest";
import {
  createTokenValue,
  EMAIL_TOKEN_TTL_MS,
  hashTokenValue,
} from "../src/features/core/auth/core/token";

describe("token generation and hashing", () => {
  test("createTokenValue produces distinct hex values across calls", () => {
    const first = createTokenValue();
    const second = createTokenValue();

    expect(first).not.toBe(second);
    expect(first).toMatch(/^[0-9a-f]+$/);
  });

  test("createTokenValue respects the requested byte length", () => {
    const token = createTokenValue(8);

    // hex encoding doubles the byte length in characters
    expect(token).toHaveLength(16);
  });

  test("hashTokenValue is deterministic for the same input", () => {
    const token = createTokenValue();

    expect(hashTokenValue(token)).toBe(hashTokenValue(token));
  });

  test("hashTokenValue differs for different inputs", () => {
    expect(hashTokenValue(createTokenValue())).not.toBe(
      hashTokenValue(createTokenValue()),
    );
  });

  test("EMAIL_TOKEN_TTL_MS is exactly 24 hours", () => {
    expect(EMAIL_TOKEN_TTL_MS).toBe(24 * 60 * 60 * 1000);
  });
});
