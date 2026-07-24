import { describe, expect, test } from "vitest";
import { levelMutationSchema } from "../src/features/system/content-library/levels/server/schemas";

describe("levelMutationSchema", () => {
  const courseId = "c1f2e3d4-5678-4abc-9def-0123456789ab";

  test("accepts a valid name", () => {
    const result = levelMutationSchema.safeParse({
      courseId,
      name: "Beginner",
    });
    expect(result.success).toBe(true);
  });

  test("rejects a blank name", () => {
    const result = levelMutationSchema.safeParse({ courseId, name: "   " });
    expect(result.success).toBe(false);
  });

  test("rejects a missing courseId", () => {
    const result = levelMutationSchema.safeParse({ name: "Beginner" });
    expect(result.success).toBe(false);
  });

  test("rejects a name over 256 characters", () => {
    const result = levelMutationSchema.safeParse({
      courseId,
      name: "a".repeat(257),
    });
    expect(result.success).toBe(false);
  });

  test("trims the name before validation", () => {
    const result = levelMutationSchema.safeParse({
      courseId,
      name: "  Beginner  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Beginner");
    }
  });
});
