import { describe, expect, test } from "vitest";
import type { ScorableQuestion } from "../src/features/system/assessments/responses/server/scoring";
import {
  normalizeAnswerText,
  scoreFormResponse,
} from "../src/features/system/assessments/responses/server/scoring";

/** Choice questions never consult the accepted-answer text. */
function choice(id: string, isCorrect: boolean) {
  return { id, text: id, isCorrect };
}

describe("scoreFormResponse — choice questions", () => {
  test("awards full points for a correct single-choice answer", () => {
    const questions: ScorableQuestion[] = [
      {
        id: "q1",
        text: "Pick one",
        type: "single_choice",
        points: 2,
        answers: [choice("a1", true), choice("a2", false)],
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
        text: "Pick one",
        type: "single_choice",
        points: 2,
        answers: [choice("a1", true), choice("a2", false)],
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
        text: "Pick all",
        type: "multiple_choice",
        points: 3,
        answers: [choice("a1", true), choice("a2", true), choice("a3", false)],
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
        text: "One",
        type: "single_choice",
        points: 1,
        answers: [choice("a1", true)],
      },
      {
        id: "q2",
        text: "Two",
        type: "single_choice",
        points: 4,
        answers: [choice("a2", true)],
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
        text: "One",
        type: "single_choice",
        points: 1,
        answers: [choice("a1", true)],
      },
    ];

    expect(scoreFormResponse(questions, [])).toBe(0);
  });

  test("scores a question with no correct answers as incorrect, not a vacuous match", () => {
    const questions: ScorableQuestion[] = [
      {
        id: "q1",
        text: "One",
        type: "single_choice",
        points: 3,
        answers: [choice("a1", false), choice("a2", false)],
      },
    ];

    const unanswered = scoreFormResponse(questions, []);
    const answered = scoreFormResponse(questions, [
      { questionId: "q1", selectedAnswerIds: ["a1"] },
    ]);

    expect(unanswered).toBe(0);
    expect(answered).toBe(0);
  });

  test("returns 0 for a form with no questions", () => {
    expect(scoreFormResponse([], [])).toBe(0);
  });
});

describe("normalizeAnswerText", () => {
  test("folds case, surrounding and repeated whitespace", () => {
    expect(normalizeAnswerText("  The   Mitochondria ")).toBe(
      "the mitochondria",
    );
  });

  test("folds punctuation and Latin accents", () => {
    expect(normalizeAnswerText("Café, au-lait!")).toBe(
      normalizeAnswerText("cafe au lait"),
    );
  });

  test("folds Arabic tashkeel and interchangeable letter forms", () => {
    // أ vs ا, ة vs ه, and the vowel marks a student may or may not type.
    expect(normalizeAnswerText("القَاهِرَة")).toBe(normalizeAnswerText("القاهره"));
    expect(normalizeAnswerText("أحمد")).toBe(normalizeAnswerText("احمد"));
  });

  test("does not collapse genuinely different answers", () => {
    expect(normalizeAnswerText("nucleus")).not.toBe(
      normalizeAnswerText("mitochondria"),
    );
  });
});

describe("scoreFormResponse — short answers", () => {
  const question = (accepted: string[], points = 5): ScorableQuestion[] => [
    {
      id: "q1",
      text: "Which organelle produces most of the cell's ATP?",
      type: "short_answer",
      points,
      answers: accepted.map((text, index) => ({
        id: `a${index}`,
        text,
        isCorrect: true,
      })),
    },
  ];

  test("awards points for an exact match without consulting the model", () => {
    const score = scoreFormResponse(question(["mitochondria"]), [
      { questionId: "q1", text: "mitochondria" },
    ]);

    expect(score).toBe(5);
  });

  test("awards points for a match differing only in case, spacing or punctuation", () => {
    const score = scoreFormResponse(question(["mitochondria"]), [
      { questionId: "q1", text: "  The Mitochondria. " },
    ]);

    // "the mitochondria" !== "mitochondria", so this one still needs a model —
    // normalisation folds formatting, not extra words.
    expect(score).toBeNull();

    const exact = scoreFormResponse(question(["mitochondria"]), [
      { questionId: "q1", text: "  Mitochondria! " },
    ]);
    expect(exact).toBe(5);
  });

  test("matches any one of several accepted answers", () => {
    const questions = question(["mitochondria", "the mitochondrion"]);

    expect(
      scoreFormResponse(questions, [
        { questionId: "q1", text: "The Mitochondrion" },
      ]),
    ).toBe(5);
  });

  test("awards points when the model rules a paraphrase correct", () => {
    const score = scoreFormResponse(
      question(["mitochondria"]),
      [{ questionId: "q1", text: "the powerhouse of the cell" }],
      new Map([["q1", true]]),
    );

    expect(score).toBe(5);
  });

  test("awards zero when the model rules the answer incorrect", () => {
    const score = scoreFormResponse(
      question(["mitochondria"]),
      [{ questionId: "q1", text: "the nucleus" }],
      new Map([["q1", false]]),
    );

    expect(score).toBe(0);
  });

  test("scores a blank answer as incorrect rather than deferring it", () => {
    const blank = scoreFormResponse(question(["mitochondria"]), [
      { questionId: "q1", text: "   " },
    ]);
    const missing = scoreFormResponse(question(["mitochondria"]), []);

    expect(blank).toBe(0);
    expect(missing).toBe(0);
  });

  test("returns null when the model reached no verdict", () => {
    // No entry for q1 — key unset, request failed, or the model skipped it.
    const score = scoreFormResponse(question(["mitochondria"]), [
      { questionId: "q1", text: "the powerhouse of the cell" },
    ]);

    expect(score).toBeNull();
  });

  test("returns null when no accepted answers are configured", () => {
    const questions: ScorableQuestion[] = [
      {
        id: "q1",
        text: "Explain photosynthesis",
        type: "short_answer",
        points: 5,
        answers: [],
      },
    ];

    const score = scoreFormResponse(
      questions,
      [{ questionId: "q1", text: "anything at all" }],
      // Even a verdict can't rescue it — there was nothing to grade against.
      new Map([["q1", true]]),
    );

    expect(score).toBeNull();
  });

  test("one ungraded question ungrades the whole response", () => {
    const questions: ScorableQuestion[] = [
      {
        id: "q1",
        text: "Pick one",
        type: "single_choice",
        points: 1,
        answers: [choice("a1", true)],
      },
      {
        id: "q2",
        text: "Name the organelle",
        type: "short_answer",
        points: 5,
        answers: [{ id: "a2", text: "mitochondria", isCorrect: true }],
      },
    ];

    const score = scoreFormResponse(questions, [
      { questionId: "q1", selectedAnswerIds: ["a1"] },
      { questionId: "q2", text: "the powerhouse of the cell" },
    ]);

    expect(score).toBeNull();
  });

  test("mixes choice and short-answer points once every question is graded", () => {
    const questions: ScorableQuestion[] = [
      {
        id: "q1",
        text: "Pick one",
        type: "single_choice",
        points: 1,
        answers: [choice("a1", true)],
      },
      {
        id: "q2",
        text: "Name the organelle",
        type: "short_answer",
        points: 5,
        answers: [{ id: "a2", text: "mitochondria", isCorrect: true }],
      },
    ];

    const score = scoreFormResponse(
      questions,
      [
        { questionId: "q1", selectedAnswerIds: ["a1"] },
        { questionId: "q2", text: "the powerhouse of the cell" },
      ],
      new Map([["q2", true]]),
    );

    expect(score).toBe(6);
  });
});
