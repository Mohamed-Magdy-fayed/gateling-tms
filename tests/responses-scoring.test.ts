import { describe, expect, test } from "vitest";
import type { ScorableQuestion } from "../src/features/system/assessments/responses/server/scoring";
import { scoreFormResponse } from "../src/features/system/assessments/responses/server/scoring";

describe("scoreFormResponse", () => {
  test("awards full points for a correct single-choice answer", () => {
    const questions: ScorableQuestion[] = [
      {
        id: "q1",
        type: "single_choice",
        points: 2,
        answers: [
          { id: "a1", isCorrect: true },
          { id: "a2", isCorrect: false },
        ],
      },
    ];

    const score = scoreFormResponse(questions, [
      { questionId: "q1", selectedAnswerIds: ["a1"] },
    ]);

    expect(score).toBe(2);
  });

  test("awards zero for a wrong single-choice answer", () => {
    const questions: ScorableQuestion[] = [
      {
        id: "q1",
        type: "single_choice",
        points: 2,
        answers: [
          { id: "a1", isCorrect: true },
          { id: "a2", isCorrect: false },
        ],
      },
    ];

    const score = scoreFormResponse(questions, [
      { questionId: "q1", selectedAnswerIds: ["a2"] },
    ]);

    expect(score).toBe(0);
  });

  test("requires an exact match for multiple-choice — a subset doesn't count", () => {
    const questions: ScorableQuestion[] = [
      {
        id: "q1",
        type: "multiple_choice",
        points: 3,
        answers: [
          { id: "a1", isCorrect: true },
          { id: "a2", isCorrect: true },
          { id: "a3", isCorrect: false },
        ],
      },
    ];

    const partial = scoreFormResponse(questions, [
      { questionId: "q1", selectedAnswerIds: ["a1"] },
    ]);
    const exact = scoreFormResponse(questions, [
      { questionId: "q1", selectedAnswerIds: ["a1", "a2"] },
    ]);
    const withExtra = scoreFormResponse(questions, [
      { questionId: "q1", selectedAnswerIds: ["a1", "a2", "a3"] },
    ]);

    expect(partial).toBe(0);
    expect(exact).toBe(3);
    expect(withExtra).toBe(0);
  });

  test("sums points across multiple auto-scorable questions", () => {
    const questions: ScorableQuestion[] = [
      {
        id: "q1",
        type: "single_choice",
        points: 1,
        answers: [{ id: "a1", isCorrect: true }],
      },
      {
        id: "q2",
        type: "single_choice",
        points: 4,
        answers: [{ id: "a2", isCorrect: true }],
      },
    ];

    const score = scoreFormResponse(questions, [
      { questionId: "q1", selectedAnswerIds: ["a1"] },
      { questionId: "q2", selectedAnswerIds: ["a2"] },
    ]);

    expect(score).toBe(5);
  });

  test("treats an unanswered question as incorrect, not missing", () => {
    const questions: ScorableQuestion[] = [
      {
        id: "q1",
        type: "single_choice",
        points: 1,
        answers: [{ id: "a1", isCorrect: true }],
      },
    ];

    const score = scoreFormResponse(questions, []);

    expect(score).toBe(0);
  });

  test("returns null (needs manual grading) the moment any question is short_answer", () => {
    const questions: ScorableQuestion[] = [
      {
        id: "q1",
        type: "single_choice",
        points: 1,
        answers: [{ id: "a1", isCorrect: true }],
      },
      {
        id: "q2",
        type: "short_answer",
        points: 5,
        answers: [],
      },
    ];

    const score = scoreFormResponse(questions, [
      { questionId: "q1", selectedAnswerIds: ["a1"] },
      { questionId: "q2", text: "some free-form answer" },
    ]);

    expect(score).toBeNull();
  });

  test("returns 0 for a form with no questions", () => {
    const score = scoreFormResponse([], []);
    expect(score).toBe(0);
  });
});
