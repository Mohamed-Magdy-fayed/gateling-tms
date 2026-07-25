import { describe, expect, test } from "vitest";
import { answerMutationSchema } from "../src/features/system/assessments/answers/server/schemas";

describe("answerMutationSchema", () => {
  const questionId = "c1f2e3d4-5678-4abc-9def-0123456789ab";

  test("accepts a correct answer", () => {
    const result = answerMutationSchema.safeParse({
      questionId,
      text: "4",
      isCorrect: true,
    });
    expect(result.success).toBe(true);
  });

  test("accepts an incorrect answer", () => {
    const result = answerMutationSchema.safeParse({
      questionId,
      text: "5",
      isCorrect: false,
    });
    expect(result.success).toBe(true);
  });

  test("rejects a blank answer text", () => {
    const result = answerMutationSchema.safeParse({
      questionId,
      text: "   ",
      isCorrect: false,
    });
    expect(result.success).toBe(false);
  });

  test("rejects a missing isCorrect flag", () => {
    const result = answerMutationSchema.safeParse({
      questionId,
      text: "4",
    });
    expect(result.success).toBe(false);
  });
});
