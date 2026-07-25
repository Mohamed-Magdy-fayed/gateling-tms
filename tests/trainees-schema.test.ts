import { describe, expect, test } from "vitest";
import { traineeMutationSchema } from "../src/features/system/learning-flow/trainees/server/schemas";

describe("traineeMutationSchema", () => {
  test("accepts a name with no phone or email", () => {
    const result = traineeMutationSchema.safeParse({ name: "Sara Ahmed" });
    expect(result.success).toBe(true);
  });

  test("accepts a name with phone and email", () => {
    const result = traineeMutationSchema.safeParse({
      name: "Sara Ahmed",
      phone: "01000000000",
      email: "sara@example.com",
    });
    expect(result.success).toBe(true);
  });

  test("rejects a blank name", () => {
    const result = traineeMutationSchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
  });

  test("rejects a name over 256 characters", () => {
    const result = traineeMutationSchema.safeParse({ name: "a".repeat(257) });
    expect(result.success).toBe(false);
  });

  test("trims the name before validation", () => {
    const result = traineeMutationSchema.safeParse({ name: "  Sara Ahmed  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Sara Ahmed");
    }
  });

  test("accepts an empty-string email (cleared)", () => {
    const result = traineeMutationSchema.safeParse({
      name: "Sara Ahmed",
      email: "",
    });
    expect(result.success).toBe(true);
  });

  test("rejects an invalid email", () => {
    const result = traineeMutationSchema.safeParse({
      name: "Sara Ahmed",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  test("rejects a phone over 32 characters", () => {
    const result = traineeMutationSchema.safeParse({
      name: "Sara Ahmed",
      phone: "1".repeat(33),
    });
    expect(result.success).toBe(false);
  });
});
