import { describe, expect, test } from "vitest";
import { mapGoogleForm } from "../src/features/system/assessments/google-import/lib/map-google-form";
import type { GoogleForm } from "../src/integrations/google/forms";

function form(overrides: Partial<GoogleForm> = {}): GoogleForm {
  return {
    formId: "form-1",
    info: { title: "Unit 1 quiz" },
    items: [],
    ...overrides,
  };
}

function choiceItem(
  title: string,
  type: "RADIO" | "CHECKBOX" | "DROP_DOWN",
  options: string[],
  extra: { correct?: string[]; points?: number; isOther?: boolean } = {},
) {
  return {
    title,
    questionItem: {
      question: {
        choiceQuestion: {
          type,
          options: [
            ...options.map((value) => ({ value })),
            ...(extra.isOther ? [{ value: "", isOther: true }] : []),
          ],
        },
        grading: {
          pointValue: extra.points,
          correctAnswers: extra.correct
            ? { answers: extra.correct.map((value) => ({ value })) }
            : undefined,
        },
      },
    },
  };
}

const noteCodes = (mapped: ReturnType<typeof mapGoogleForm>) =>
  mapped.notes.map((note) => note.code);

describe("mapGoogleForm — structure", () => {
  test("puts items before the first page break in a section named after the form", () => {
    const mapped = mapGoogleForm(
      form({ items: [choiceItem("Pick one", "RADIO", ["A", "B"])] }),
    );

    expect(mapped.sections).toHaveLength(1);
    expect(mapped.sections[0].title).toBe("Unit 1 quiz");
    expect(mapped.sections[0].order).toBe(0);
    expect(mapped.questionCount).toBe(1);
  });

  test("starts a new section at each page break and carries its title", () => {
    const mapped = mapGoogleForm(
      form({
        items: [
          choiceItem("Q1", "RADIO", ["A"]),
          { title: "Listening", pageBreakItem: {} },
          choiceItem("Q2", "RADIO", ["B"]),
          { title: "Reading", pageBreakItem: {} },
          choiceItem("Q3", "RADIO", ["C"]),
        ],
      }),
    );

    expect(mapped.sections.map((section) => section.title)).toEqual([
      "Unit 1 quiz",
      "Listening",
      "Reading",
    ]);
    expect(mapped.sections.map((section) => section.order)).toEqual([0, 1, 2]);
    expect(mapped.questionCount).toBe(3);
  });

  test("drops a section whose every item was skipped", () => {
    const mapped = mapGoogleForm(
      form({
        items: [
          choiceItem("Q1", "RADIO", ["A"]),
          { title: "Attachments", pageBreakItem: {} },
          {
            title: "Upload your CV",
            questionItem: { question: { fileUploadQuestion: {} } },
          },
        ],
      }),
    );

    expect(mapped.sections).toHaveLength(1);
    expect(mapped.sections[0].title).toBe("Unit 1 quiz");
    expect(noteCodes(mapped)).toEqual(["skippedUnsupported"]);
  });

  test("numbers questions from zero within each section", () => {
    const mapped = mapGoogleForm(
      form({
        items: [
          choiceItem("Q1", "RADIO", ["A"]),
          choiceItem("Q2", "RADIO", ["B"]),
          { title: "Part two", pageBreakItem: {} },
          choiceItem("Q3", "RADIO", ["C"]),
        ],
      }),
    );

    expect(mapped.sections[0].questions.map((q) => q.order)).toEqual([0, 1]);
    expect(mapped.sections[1].questions.map((q) => q.order)).toEqual([0]);
  });

  test("maps an empty form to no sections and no questions", () => {
    const mapped = mapGoogleForm(form({ items: [] }));

    expect(mapped.sections).toEqual([]);
    expect(mapped.questionCount).toBe(0);
    expect(mapped.notes).toEqual([]);
  });

  test("carries the form description and quiz flag", () => {
    const mapped = mapGoogleForm(
      form({
        info: { title: "Placement", description: "  30 minutes  " },
        settings: { quizSettings: { isQuiz: true } },
      }),
    );

    expect(mapped.description).toBe("30 minutes");
    expect(mapped.isQuiz).toBe(true);
  });

  test("truncates a title too long for the column and says so", () => {
    const longTitle = "x".repeat(300);
    const mapped = mapGoogleForm(form({ info: { title: longTitle } }));

    expect(mapped.title).toHaveLength(256);
    expect(noteCodes(mapped)).toEqual(["truncatedTitle"]);
  });
});

describe("mapGoogleForm — question types", () => {
  test("RADIO becomes a single-choice question with its options in order", () => {
    const mapped = mapGoogleForm(
      form({ items: [choiceItem("Capital?", "RADIO", ["Cairo", "Giza"])] }),
    );
    const question = mapped.sections[0].questions[0];

    expect(question.type).toBe("single_choice");
    expect(question.answers).toEqual([
      { text: "Cairo", isCorrect: false, order: 0 },
      { text: "Giza", isCorrect: false, order: 1 },
    ]);
    expect(mapped.notes).toEqual([]);
  });

  test("CHECKBOX becomes a multiple-choice question", () => {
    const mapped = mapGoogleForm(
      form({ items: [choiceItem("Pick all", "CHECKBOX", ["A", "B"])] }),
    );

    expect(mapped.sections[0].questions[0].type).toBe("multiple_choice");
  });

  test("DROP_DOWN becomes single choice and is flagged as converted", () => {
    const mapped = mapGoogleForm(
      form({ items: [choiceItem("Level", "DROP_DOWN", ["A1", "A2"])] }),
    );

    expect(mapped.sections[0].questions[0].type).toBe("single_choice");
    expect(noteCodes(mapped)).toEqual(["convertedDropdown"]);
  });

  test("a short text question becomes a short answer with no options", () => {
    const mapped = mapGoogleForm(
      form({
        items: [
          {
            title: "Your name",
            questionItem: { question: { textQuestion: {} } },
          },
        ],
      }),
    );
    const question = mapped.sections[0].questions[0];

    expect(question.type).toBe("short_answer");
    expect(question.answers).toEqual([]);
    expect(mapped.notes).toEqual([]);
  });

  test("a paragraph question also becomes a short answer, flagged", () => {
    const mapped = mapGoogleForm(
      form({
        items: [
          {
            title: "Tell us more",
            questionItem: { question: { textQuestion: { paragraph: true } } },
          },
        ],
      }),
    );

    expect(mapped.sections[0].questions[0].type).toBe("short_answer");
    expect(noteCodes(mapped)).toEqual(["convertedParagraph"]);
  });

  test("a linear scale becomes one answer per step, with the end labels kept", () => {
    const mapped = mapGoogleForm(
      form({
        items: [
          {
            title: "Rate the course",
            questionItem: {
              question: {
                scaleQuestion: {
                  low: 1,
                  high: 3,
                  lowLabel: "Poor",
                  highLabel: "Great",
                },
              },
            },
          },
        ],
      }),
    );
    const question = mapped.sections[0].questions[0];

    expect(question.type).toBe("single_choice");
    expect(question.answers.map((answer) => answer.text)).toEqual([
      "1 — Poor",
      "2",
      "3 — Great",
    ]);
    expect(noteCodes(mapped)).toEqual(["convertedScale"]);
  });

  test.each([
    ["dateQuestion", { dateQuestion: {} }],
    ["timeQuestion", { timeQuestion: {} }],
    ["fileUploadQuestion", { fileUploadQuestion: {} }],
    ["ratingQuestion", { ratingQuestion: {} }],
  ])("skips an unsupported %s and lists it", (_label, question) => {
    const mapped = mapGoogleForm(
      form({ items: [{ title: "Unsupported", questionItem: { question } }] }),
    );

    expect(mapped.questionCount).toBe(0);
    expect(mapped.notes).toEqual([
      { id: 0, code: "skippedUnsupported", title: "Unsupported" },
    ]);
  });

  test("skips a grid, which is several questions in one Google item", () => {
    const mapped = mapGoogleForm(
      form({
        items: [
          {
            title: "Rate each teacher",
            questionGroupItem: { questions: [{}, {}] },
          },
        ],
      }),
    );

    expect(mapped.questionCount).toBe(0);
    expect(noteCodes(mapped)).toEqual(["skippedGrid"]);
  });

  test("lists text, image and video items as content rather than questions", () => {
    const mapped = mapGoogleForm(
      form({
        items: [
          { title: "Read this first", textItem: {} },
          { title: "Diagram", imageItem: {} },
          { title: "Intro clip", videoItem: {} },
        ],
      }),
    );

    expect(mapped.questionCount).toBe(0);
    expect(noteCodes(mapped)).toEqual([
      "skippedContent",
      "skippedContent",
      "skippedContent",
    ]);
  });

  test("skips a choice question that has no usable options", () => {
    const mapped = mapGoogleForm(
      form({ items: [choiceItem("Pick one", "RADIO", [])] }),
    );

    expect(mapped.questionCount).toBe(0);
    expect(noteCodes(mapped)).toEqual(["skippedEmptyChoice"]);
  });

  test("drops Google's free-text 'Other' option and says so", () => {
    const mapped = mapGoogleForm(
      form({
        items: [
          choiceItem("Where from?", "RADIO", ["Cairo"], { isOther: true }),
        ],
      }),
    );

    expect(mapped.sections[0].questions[0].answers).toHaveLength(1);
    expect(noteCodes(mapped)).toEqual(["droppedOtherOption"]);
  });

  test("falls back to a placeholder for an untitled question", () => {
    const mapped = mapGoogleForm(
      form({ items: [choiceItem("", "RADIO", ["A"])] }),
    );

    expect(mapped.sections[0].questions[0].text).toBe("Untitled");
  });
});

describe("mapGoogleForm — quiz grading", () => {
  test("marks the graded option correct and keeps its point value", () => {
    const mapped = mapGoogleForm(
      form({
        settings: { quizSettings: { isQuiz: true } },
        items: [
          choiceItem("Capital?", "RADIO", ["Cairo", "Giza"], {
            correct: ["Cairo"],
            points: 5,
          }),
        ],
      }),
    );
    const question = mapped.sections[0].questions[0];

    expect(question.points).toBe(5);
    expect(question.answers.map((answer) => answer.isCorrect)).toEqual([
      true,
      false,
    ]);
    expect(mapped.notes).toEqual([]);
  });

  test("marks every correct option of a multi-answer question", () => {
    const mapped = mapGoogleForm(
      form({
        settings: { quizSettings: { isQuiz: true } },
        items: [
          choiceItem("Pick two", "CHECKBOX", ["A", "B", "C"], {
            correct: ["A", "C"],
            points: 2,
          }),
        ],
      }),
    );

    expect(
      mapped.sections[0].questions[0].answers.map((a) => a.isCorrect),
    ).toEqual([true, false, true]);
  });

  test("flags a correct answer that matches none of the options", () => {
    const mapped = mapGoogleForm(
      form({
        settings: { quizSettings: { isQuiz: true } },
        items: [
          choiceItem("Capital?", "RADIO", ["Cairo"], { correct: ["Luxor"] }),
        ],
      }),
    );

    expect(noteCodes(mapped)).toEqual(["unmatchedCorrectAnswer"]);
  });

  test("gives repeated notes distinct ids", () => {
    // Two unmatched answers on one question produce the same code and title
    // twice — the pair is not a usable key, which is why `id` exists.
    const mapped = mapGoogleForm(
      form({
        settings: { quizSettings: { isQuiz: true } },
        items: [
          choiceItem("Capital?", "RADIO", ["Cairo"], {
            correct: ["Luxor", "Aswan"],
          }),
        ],
      }),
    );

    expect(noteCodes(mapped)).toEqual([
      "unmatchedCorrectAnswer",
      "unmatchedCorrectAnswer",
    ]);
    expect(new Set(mapped.notes.map((note) => note.id)).size).toBe(2);
  });

  test("defaults to one point when a quiz question carries no point value", () => {
    const mapped = mapGoogleForm(
      form({
        settings: { quizSettings: { isQuiz: true } },
        items: [choiceItem("Q", "RADIO", ["A"])],
      }),
    );

    expect(mapped.sections[0].questions[0].points).toBe(1);
  });

  test("gives every question one point when the form isn't a quiz", () => {
    // Google carries no per-question points outside quiz mode, and a zero
    // would make an imported assignment unscoreable.
    const mapped = mapGoogleForm(
      form({ items: [choiceItem("Q", "RADIO", ["A"], { points: 7 })] }),
    );

    expect(mapped.sections[0].questions[0].points).toBe(1);
  });
});
