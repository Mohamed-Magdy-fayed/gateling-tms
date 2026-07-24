import { describe, expect, test } from "vitest";
import { questionMutationSchema } from "../src/features/system/assessments/questions/server/schemas";

describe("questionMutationSchema", () => {
  const sectionId = "c1f2e3d4-5678-4abc-9def-0123456789ab";

  test("accepts a valid single-choice question", () => {
    const result = questionMutationSchema.safeParse({
      sectionId,
      text: "What is 2 + 2?",
      type: "single_choice",
      points: 1,
    });
    expect(result.success).toBe(true);
  });

  test("accepts a short-answer question", () => {
    const result = questionMutationSchema.safeParse({
      sectionId,
      text: "Explain your reasoning.",
      type: "short_answer",
      points: 5,
    });
    expect(result.success).toBe(true);
  });

  test("rejects a blank question text", () => {
    const result = questionMutationSchema.safeParse({
      sectionId,
      text: "   ",
      type: "single_choice",
      points: 1,
    });
    expect(result.success).toBe(false);
  });

  test("rejects an invalid question type", () => {
    const result = questionMutationSchema.safeParse({
      sectionId,
      text: "What is 2 + 2?",
      type: "essay",
      points: 1,
    });
    expect(result.success).toBe(false);
  });

  test("rejects negative points", () => {
    const result = questionMutationSchema.safeParse({
      sectionId,
      text: "What is 2 + 2?",
      type: "single_choice",
      points: -1,
    });
    expect(result.success).toBe(false);
  });
});
