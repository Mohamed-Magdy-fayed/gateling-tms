import { describe, expect, test } from "vitest";
import { gradeResponseSchema } from "../src/features/system/assessments/responses/server/schemas";
import {
  type ScorableQuestion,
  sumQuestionPoints,
} from "../src/features/system/assessments/responses/server/scoring";

const RESPONSE_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

function question(overrides: Partial<ScorableQuestion> = {}): ScorableQuestion {
  return {
    id: "q1",
    text: "Question",
    type: "short_answer",
    points: 5,
    answers: [],
    ...overrides,
  };
}

describe("gradeResponseSchema", () => {
  test("accepts a whole score of zero or more", () => {
    expect(
      gradeResponseSchema.safeParse({ responseId: RESPONSE_ID, score: 0 })
        .success,
    ).toBe(true);
    expect(
      gradeResponseSchema.safeParse({ responseId: RESPONSE_ID, score: 7 })
        .success,
    ).toBe(true);
  });

  test("rejects a negative score", () => {
    expect(
      gradeResponseSchema.safeParse({ responseId: RESPONSE_ID, score: -1 })
        .success,
    ).toBe(false);
  });

  test("rejects a fractional score", () => {
    expect(
      gradeResponseSchema.safeParse({ responseId: RESPONSE_ID, score: 4.5 })
        .success,
    ).toBe(false);
  });

  test("rejects a cleared number input with the translated required key", () => {
    const result = gradeResponseSchema.safeParse({
      responseId: RESPONSE_ID,
      score: null,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("forms.validation.required");
    }
  });

  test("rejects a response id that isn't a uuid", () => {
    expect(
      gradeResponseSchema.safeParse({ responseId: "nope", score: 1 }).success,
    ).toBe(false);
  });
});

describe("sumQuestionPoints", () => {
  test("adds up every question's points, whatever its type", () => {
    expect(
      sumQuestionPoints([
        question({ id: "q1", points: 5 }),
        question({ id: "q2", type: "single_choice", points: 3 }),
        question({ id: "q3", type: "multiple_choice", points: 2 }),
      ]),
    ).toBe(10);
  });

  test("is zero for a form with no questions", () => {
    expect(sumQuestionPoints([])).toBe(0);
  });
});
