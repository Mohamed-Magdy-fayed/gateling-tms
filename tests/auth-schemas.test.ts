import { describe, expect, test } from "vitest";
import {
  otpSchema,
  passwordSchema,
  signUpSchema,
} from "../src/features/core/auth/schemas";

describe("passwordSchema", () => {
  test("accepts a password with lowercase, uppercase, and a digit", () => {
    expect(passwordSchema.safeParse("Passw0rd").success).toBe(true);
  });

  test("rejects a password shorter than 8 characters", () => {
    const result = passwordSchema.safeParse("Pw0");
    expect(result.success).toBe(false);
  });

  test("rejects a password missing an uppercase letter", () => {
    const result = passwordSchema.safeParse("password0");
    expect(result.success).toBe(false);
  });

  test("rejects a password missing a digit", () => {
    const result = passwordSchema.safeParse("Password");
    expect(result.success).toBe(false);
  });

  test("reports every failing rule, not just the first", () => {
    const result = passwordSchema.safeParse("short");
    if (result.success) throw new Error("expected validation to fail");
    // too short, no uppercase, no digit — 3 separate issues
    expect(result.error.issues.length).toBeGreaterThanOrEqual(3);
  });
});

describe("otpSchema", () => {
  test("accepts a 6-digit code", () => {
    expect(otpSchema.safeParse("123456").success).toBe(true);
  });

  test("trims surrounding whitespace before validating", () => {
    expect(otpSchema.safeParse("  123456  ").success).toBe(true);
  });

  test("rejects a code with fewer than 6 digits", () => {
    expect(otpSchema.safeParse("12345").success).toBe(false);
  });

  test("rejects a code with non-digit characters", () => {
    expect(otpSchema.safeParse("12345a").success).toBe(false);
  });
});

describe("signUpSchema", () => {
  const validInput = {
    name: "Trainer One",
    email: "trainer@example.com",
    phone: "+201234567",
    password: "Passw0rd",
  };

  test("accepts a fully valid submission", () => {
    expect(signUpSchema.safeParse(validInput).success).toBe(true);
  });

  test("rejects a blank name", () => {
    const result = signUpSchema.safeParse({ ...validInput, name: "  " });
    expect(result.success).toBe(false);
  });

  test("rejects an invalid email", () => {
    const result = signUpSchema.safeParse({ ...validInput, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  test("rejects a phone number under 8 characters", () => {
    const result = signUpSchema.safeParse({ ...validInput, phone: "123" });
    expect(result.success).toBe(false);
  });
});
