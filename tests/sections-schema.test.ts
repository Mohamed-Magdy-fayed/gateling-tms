import { describe, expect, test } from "vitest";
import { sectionMutationSchema } from "../src/features/system/assessments/sections/server/schemas";

describe("sectionMutationSchema", () => {
  const formId = "c1f2e3d4-5678-4abc-9def-0123456789ab";

  test("accepts a valid title", () => {
    const result = sectionMutationSchema.safeParse({
      formId,
      title: "Section 1",
    });
    expect(result.success).toBe(true);
  });

  test("rejects a blank title", () => {
    const result = sectionMutationSchema.safeParse({ formId, title: "   " });
    expect(result.success).toBe(false);
  });

  test("rejects a missing formId", () => {
    const result = sectionMutationSchema.safeParse({ title: "Section 1" });
    expect(result.success).toBe(false);
  });

  test("rejects a title over 256 characters", () => {
    const result = sectionMutationSchema.safeParse({
      formId,
      title: "a".repeat(257),
    });
    expect(result.success).toBe(false);
  });
});
