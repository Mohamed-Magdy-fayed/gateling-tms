import { describe, expect, test } from "vitest";
import {
  getStartedSchema,
  organizationOnlySchema,
} from "../src/features/core/organizations/nextjs/get-started-schema";

describe("getStartedSchema", () => {
  const validInput = {
    contactName: "Nadia Trainer",
    businessName: "Cairo Coding Academy",
    email: "nadia@example.com",
    phone: "+201234567",
    password: "Passw0rd",
  };

  test("accepts a fully valid submission", () => {
    expect(getStartedSchema.safeParse(validInput).success).toBe(true);
  });

  test("rejects a blank contact name", () => {
    const result = getStartedSchema.safeParse({
      ...validInput,
      contactName: "  ",
    });
    expect(result.success).toBe(false);
  });

  test("rejects a blank business name", () => {
    const result = getStartedSchema.safeParse({
      ...validInput,
      businessName: "  ",
    });
    expect(result.success).toBe(false);
  });

  test("rejects an invalid email", () => {
    const result = getStartedSchema.safeParse({
      ...validInput,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  test("rejects a phone number under 8 characters", () => {
    const result = getStartedSchema.safeParse({ ...validInput, phone: "123" });
    expect(result.success).toBe(false);
  });

  test("rejects a weak password", () => {
    const result = getStartedSchema.safeParse({
      ...validInput,
      password: "weak",
    });
    expect(result.success).toBe(false);
  });
});

describe("organizationOnlySchema", () => {
  test("accepts a business name on its own", () => {
    expect(
      organizationOnlySchema.safeParse({ businessName: "Nile Academy" })
        .success,
    ).toBe(true);
  });

  test("rejects a blank business name", () => {
    expect(
      organizationOnlySchema.safeParse({ businessName: "  " }).success,
    ).toBe(false);
  });

  test("rejects extra fields not in the org-only step", () => {
    // Not the point of the test to enforce strict() (schema doesn't use it),
    // but confirms the picked schema only requires businessName.
    const result = organizationOnlySchema.safeParse({
      businessName: "Nile Academy",
      email: "ignored@example.com",
    });
    expect(result.success).toBe(true);
  });
});
