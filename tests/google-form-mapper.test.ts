import { describe, expect, test } from "vitest";
import type {
  MappedBlock,
  MappedQuestion,
  MappedSection,
} from "../src/features/system/assessments/google-import/lib/map-google-form";
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

/** Questions and content blocks share one ordered list per section. */
function questionsOf(section: MappedSection): MappedQuestion[] {
  return section.items.filter((item) => item.kind === "question");
}

function blocksOf(section: MappedSection): MappedBlock[] {
  return section.items.filter((item) => item.kind === "block");
}

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

    expect(questionsOf(mapped.sections[0]).map((q) => q.order)).toEqual([0, 1]);
    expect(questionsOf(mapped.sections[1]).map((q) => q.order)).toEqual([0]);
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
    const question = questionsOf(mapped.sections[0])[0];

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

    expect(questionsOf(mapped.sections[0])[0].type).toBe("multiple_choice");
  });

  test("DROP_DOWN becomes single choice and is flagged as converted", () => {
    const mapped = mapGoogleForm(
      form({ items: [choiceItem("Level", "DROP_DOWN", ["A1", "A2"])] }),
    );

    expect(questionsOf(mapped.sections[0])[0].type).toBe("single_choice");
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
    const question = questionsOf(mapped.sections[0])[0];

    expect(question.type).toBe("short_answer");
    expect(question.answers).toEqual([]);
    expect(mapped.notes).toEqual([]);
  });

  test("a paragraph question becomes a long answer, not a downgraded short one", () => {
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

    expect(questionsOf(mapped.sections[0])[0].type).toBe("long_answer");
    // Nothing was lost, so nothing is flagged — this used to be a downgrade.
    expect(mapped.notes).toEqual([]);
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
    const question = questionsOf(mapped.sections[0])[0];

    expect(question.type).toBe("single_choice");
    expect(question.answers.map((answer) => answer.text)).toEqual([
      "1 — Poor",
      "2",
      "3 — Great",
    ]);
    expect(noteCodes(mapped)).toEqual(["convertedScale"]);
  });

  test.each([
    ["dateQuestion", { dateQuestion: {} }, "date"],
    ["timeQuestion", { timeQuestion: {} }, "time"],
  ] as const)("imports a %s as its own type", (_label, question, type) => {
    const mapped = mapGoogleForm(
      form({ items: [{ title: "When?", questionItem: { question } }] }),
    );

    expect(questionsOf(mapped.sections[0])[0].type).toBe(type);
    expect(mapped.notes).toEqual([]);
  });

  test("a star rating becomes one answer per step, like a scale", () => {
    const mapped = mapGoogleForm(
      form({
        items: [
          {
            title: "Rate the teacher",
            questionItem: { question: { ratingQuestion: { ratingScaleLevel: 5 } } },
          },
        ],
      }),
    );
    const question = questionsOf(mapped.sections[0])[0];

    expect(question.type).toBe("single_choice");
    expect(question.answers.map((answer) => answer.text)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
    ]);
    expect(noteCodes(mapped)).toEqual(["convertedRating"]);
  });

  // There is no upload path in a response, so importing this would create a
  // question nobody can answer.
  test("still skips a file upload, and lists it", () => {
    const mapped = mapGoogleForm(
      form({
        items: [
          {
            title: "Upload your CV",
            questionItem: { question: { fileUploadQuestion: {} } },
          },
        ],
      }),
    );

    expect(mapped.questionCount).toBe(0);
    expect(mapped.notes).toEqual([
      { id: 0, code: "skippedUnsupported", title: "Upload your CV" },
    ]);
  });

  test("a grid becomes one question per row, sharing the column options", () => {
    const mapped = mapGoogleForm(
      form({
        items: [
          {
            title: "Rate each teacher",
            questionGroupItem: {
              questions: [
                { rowQuestion: { title: "Mr Adel" }, required: true },
                { rowQuestion: { title: "Ms Hoda" } },
              ],
              grid: {
                columns: {
                  type: "RADIO",
                  options: [{ value: "Good" }, { value: "Bad" }],
                },
              },
            },
          },
        ],
      }),
    );
    const questions = questionsOf(mapped.sections[0]);

    expect(questions.map((question) => question.text)).toEqual([
      "Rate each teacher — Mr Adel",
      "Rate each teacher — Ms Hoda",
    ]);
    expect(questions.map((question) => question.order)).toEqual([0, 1]);
    expect(questions[0].isRequired).toBe(true);
    expect(questions[0].answers.map((answer) => answer.text)).toEqual([
      "Good",
      "Bad",
    ]);
    expect(noteCodes(mapped)).toEqual(["convertedGrid"]);
  });

  test("skips a grid with no columns rather than producing answerless rows", () => {
    const mapped = mapGoogleForm(
      form({
        items: [
          { title: "Broken grid", questionGroupItem: { questions: [{}, {}] } },
        ],
      }),
    );

    expect(mapped.questionCount).toBe(0);
    expect(noteCodes(mapped)).toEqual(["skippedUnsupported"]);
  });

  test("skips a scale with no bounds rather than failing the whole form", () => {
    // The payload schema keeps `low`/`high` optional so one odd question
    // can't cost the entire parse — this is where that degrades.
    const mapped = mapGoogleForm(
      form({
        items: [
          choiceItem("Q1", "RADIO", ["A"]),
          {
            title: "Rate us",
            questionItem: { question: { scaleQuestion: { lowLabel: "Poor" } } },
          },
        ],
      }),
    );

    expect(mapped.questionCount).toBe(1);
    expect(noteCodes(mapped)).toEqual(["skippedUnsupported"]);
  });

  test("lists an item kind it doesn't recognize rather than dropping it", () => {
    // Google adds item kinds over time. "Nothing is dropped silently" has to
    // hold for the shapes this schema hasn't seen yet, not only the known ones.
    const mapped = mapGoogleForm(
      form({ items: [{ itemId: "x", title: "Something new" }] }),
    );

    expect(mapped.questionCount).toBe(0);
    expect(mapped.notes).toEqual([
      { id: 0, code: "skippedUnsupported", title: "Something new" },
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

    expect(questionsOf(mapped.sections[0])[0].answers).toHaveLength(1);
    expect(noteCodes(mapped)).toEqual(["droppedOtherOption"]);
  });

  test("falls back to a placeholder for an untitled question", () => {
    const mapped = mapGoogleForm(
      form({ items: [choiceItem("", "RADIO", ["A"])] }),
    );

    expect(questionsOf(mapped.sections[0])[0].text).toBe("Untitled");
  });
});

/**
 * The gap Mohamed reported: a real comprehension form is a video, an image and
 * three passages that its questions are *about*, and all of it used to be
 * listed under "Not imported as-is".
 */
describe("mapGoogleForm — content items", () => {
  test("a text item becomes a text block keeping its heading and prose", () => {
    const mapped = mapGoogleForm(
      form({
        items: [
          {
            title: "Read this first",
            description: "  The Nile is the longest river in Africa.  ",
            textItem: {},
          },
        ],
      }),
    );
    const block = blocksOf(mapped.sections[0])[0];

    expect(block.blockKind).toBe("text");
    expect(block.title).toBe("Read this first");
    expect(block.body).toBe("The Nile is the longest river in Africa.");
    expect(mapped.blockCount).toBe(1);
    expect(mapped.notes).toEqual([]);
  });

  test("an image item keeps Google's URL as a pending source, not as media", () => {
    const mapped = mapGoogleForm(
      form({
        items: [
          {
            title: "Diagram",
            imageItem: {
              image: {
                contentUri: "https://lh3.googleusercontent.com/abc",
                altText: "A river delta",
              },
            },
          },
        ],
      }),
    );
    const block = blocksOf(mapped.sections[0])[0];

    expect(block.blockKind).toBe("image");
    // `contentUri` expires, so nothing may render it — the media job copies
    // the bytes into this app's own storage and fills `mediaUrl` in.
    expect(block.mediaUrl).toBeNull();
    expect(block.sourceUrl).toBe("https://lh3.googleusercontent.com/abc");
    expect(block.mediaAlt).toBe("A river delta");
  });

  test.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ"],
  ])("a video item at %s becomes an embeddable block", (youtubeUri) => {
    const mapped = mapGoogleForm(
      form({ items: [{ title: "Intro clip", videoItem: { video: { youtubeUri } } }] }),
    );
    const block = blocksOf(mapped.sections[0])[0];

    expect(block.blockKind).toBe("video");
    // nocookie because that is what the CSP's frame-src allows, and it sets no
    // advertising cookies on a page students are told to open for a class.
    expect(block.mediaUrl).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
    expect(block.sourceUrl).toBeNull();
  });

  test("leaves out a video whose link isn't a recognisable YouTube id", () => {
    // The id is what ends up in an iframe src, so a crafted "youtube.com" path
    // must not become an arbitrary embed.
    const mapped = mapGoogleForm(
      form({
        items: [
          {
            title: "Suspicious",
            videoItem: { video: { youtubeUri: "https://youtube.com/@evil" } },
          },
        ],
      }),
    );

    expect(mapped.blockCount).toBe(0);
    expect(noteCodes(mapped)).toEqual(["skippedUnsupported"]);
  });

  // `questions.imageAlt` and `form_blocks.mediaAlt` are varchar(256) and
  // Google imposes no such limit — an over-length description would abort the
  // whole import transaction rather than costing one alt text.
  test("caps alt text at the column width", () => {
    const longAlt = "x".repeat(400);
    const mapped = mapGoogleForm(
      form({
        items: [
          {
            title: "Diagram",
            imageItem: { image: { contentUri: "u", altText: longAlt } },
          },
          {
            title: "What shape?",
            questionItem: {
              question: { textQuestion: {} },
              image: { contentUri: "u", altText: longAlt },
            },
          },
        ],
      }),
    );

    expect(blocksOf(mapped.sections[0])[0].mediaAlt).toHaveLength(256);
    expect(questionsOf(mapped.sections[0])[0].imageAlt).toHaveLength(256);
  });

  test("keeps content and questions in the order the form had them", () => {
    const mapped = mapGoogleForm(
      form({
        items: [
          { title: "Passage", description: "…", textItem: {} },
          choiceItem("Q1", "RADIO", ["A"]),
          { title: "Diagram", imageItem: { image: { contentUri: "u" } } },
          choiceItem("Q2", "RADIO", ["B"]),
        ],
      }),
    );

    expect(
      mapped.sections[0].items.map((item) =>
        item.kind === "question" ? item.text : item.title,
      ),
    ).toEqual(["Passage", "Q1", "Diagram", "Q2"]);
    expect(mapped.sections[0].items.map((item) => item.order)).toEqual([
      0, 1, 2, 3,
    ]);
  });

  test("a section of nothing but content is kept", () => {
    // It is usually the passage the *next* section's questions are about.
    const mapped = mapGoogleForm(
      form({
        items: [
          { title: "Context", pageBreakItem: {} },
          { title: "Read this", description: "…", textItem: {} },
        ],
      }),
    );

    expect(mapped.sections).toHaveLength(1);
    expect(mapped.sections[0].title).toBe("Context");
    expect(mapped.blockCount).toBe(1);
  });
});

describe("mapGoogleForm — question metadata", () => {
  test("carries help text and the required flag", () => {
    const mapped = mapGoogleForm(
      form({
        items: [
          {
            title: "Your name",
            description: "  As it appears on your ID.  ",
            questionItem: { question: { textQuestion: {}, required: true } },
          },
        ],
      }),
    );
    const question = questionsOf(mapped.sections[0])[0];

    expect(question.description).toBe("As it appears on your ID.");
    expect(question.isRequired).toBe(true);
  });

  test("carries an image attached to the question", () => {
    const mapped = mapGoogleForm(
      form({
        items: [
          {
            title: "What shape is this?",
            questionItem: {
              question: { textQuestion: {} },
              image: { contentUri: "https://lh3.googleusercontent.com/x", altText: "A triangle" },
            },
          },
        ],
      }),
    );
    const question = questionsOf(mapped.sections[0])[0];

    expect(question.imageSourceUrl).toBe("https://lh3.googleusercontent.com/x");
    expect(question.imageAlt).toBe("A triangle");
  });

  test("keeps a quiz's accepted answers for a typed question", () => {
    // These used to be dropped outright, without even a note — yet accepted
    // wordings are exactly what `evaluateShortAnswer` grades against.
    const mapped = mapGoogleForm(
      form({
        settings: { quizSettings: { isQuiz: true } },
        items: [
          {
            title: "Capital of Egypt?",
            questionItem: {
              question: {
                textQuestion: {},
                grading: {
                  pointValue: 2,
                  correctAnswers: {
                    answers: [{ value: "Cairo" }, { value: "El Qahira" }],
                  },
                },
              },
            },
          },
        ],
      }),
    );
    const question = questionsOf(mapped.sections[0])[0];

    expect(question.points).toBe(2);
    expect(question.answers).toEqual([
      { text: "Cairo", isCorrect: true, order: 0 },
      { text: "El Qahira", isCorrect: true, order: 1 },
    ]);
  });

  test("notes an answer option's picture and per-answer feedback", () => {
    const mapped = mapGoogleForm(
      form({
        settings: { quizSettings: { isQuiz: true } },
        items: [
          {
            title: "Which one?",
            questionItem: {
              question: {
                choiceQuestion: {
                  type: "RADIO",
                  options: [
                    { value: "A", image: { contentUri: "u" } },
                    { value: "B" },
                  ],
                },
                grading: { whenWrong: {} },
              },
            },
          },
        ],
      }),
    );

    expect(noteCodes(mapped)).toEqual([
      "droppedQuestionFeedback",
      "droppedOptionImage",
    ]);
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
    const question = questionsOf(mapped.sections[0])[0];

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
      questionsOf(mapped.sections[0])[0].answers.map((a) => a.isCorrect),
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

    expect(questionsOf(mapped.sections[0])[0].points).toBe(1);
  });

  test("gives every question one point when the form isn't a quiz", () => {
    // Google carries no per-question points outside quiz mode, and a zero
    // would make an imported assignment unscoreable.
    const mapped = mapGoogleForm(
      form({ items: [choiceItem("Q", "RADIO", ["A"], { points: 7 })] }),
    );

    expect(questionsOf(mapped.sections[0])[0].points).toBe(1);
  });
});
