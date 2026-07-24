import { describe, expect, test } from "vitest";
import { courseMutationSchema } from "../src/features/system/content-library/courses/server/schemas";

describe("courseMutationSchema", () => {
  test("accepts a name with no description", () => {
    const result = courseMutationSchema.safeParse({ name: "Intro to Algebra" });
    expect(result.success).toBe(true);
  });

  test("accepts a name with a description", () => {
    const result = courseMutationSchema.safeParse({
      name: "Intro to Algebra",
      description: "Covers linear equations and basic factoring.",
    });
    expect(result.success).toBe(true);
  });

  test("rejects a blank name", () => {
    const result = courseMutationSchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
  });

  test("rejects a name over 256 characters", () => {
    const result = courseMutationSchema.safeParse({ name: "a".repeat(257) });
    expect(result.success).toBe(false);
  });

  test("rejects a description over 2000 characters", () => {
    const result = courseMutationSchema.safeParse({
      name: "Intro to Algebra",
      description: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  test("trims the name before validation", () => {
    const result = courseMutationSchema.safeParse({ name: "  Algebra  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Algebra");
    }
  });
});
