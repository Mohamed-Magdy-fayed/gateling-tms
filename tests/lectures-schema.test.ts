import { describe, expect, test } from "vitest";
import { lectureMutationSchema } from "../src/features/system/content-library/lectures/server/schemas";

describe("lectureMutationSchema", () => {
  const levelId = "c1f2e3d4-5678-4abc-9def-0123456789ab";

  test("accepts a valid name with no description/content", () => {
    const result = lectureMutationSchema.safeParse({
      levelId,
      name: "Intro to variables",
    });
    expect(result.success).toBe(true);
  });

  test("accepts a valid name with description and content", () => {
    const result = lectureMutationSchema.safeParse({
      levelId,
      name: "Intro to variables",
      description: "A short overview.",
      content: "Variables store values...",
    });
    expect(result.success).toBe(true);
  });

  test("rejects a blank name", () => {
    const result = lectureMutationSchema.safeParse({ levelId, name: "   " });
    expect(result.success).toBe(false);
  });

  test("rejects a missing levelId", () => {
    const result = lectureMutationSchema.safeParse({
      name: "Intro to variables",
    });
    expect(result.success).toBe(false);
  });

  test("rejects a name over 256 characters", () => {
    const result = lectureMutationSchema.safeParse({
      levelId,
      name: "a".repeat(257),
    });
    expect(result.success).toBe(false);
  });

  test("rejects a description over 2000 characters", () => {
    const result = lectureMutationSchema.safeParse({
      levelId,
      name: "Intro to variables",
      description: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  test("trims the name before validation", () => {
    const result = lectureMutationSchema.safeParse({
      levelId,
      name: "  Intro to variables  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Intro to variables");
    }
  });
});
