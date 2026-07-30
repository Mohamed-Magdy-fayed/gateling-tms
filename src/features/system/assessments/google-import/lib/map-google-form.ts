import type { QuestionType } from "@/drizzle/schema";
import type {
  GoogleForm,
  GoogleFormItem,
  GoogleFormQuestion,
} from "@/integrations/google/forms";

/** `varchar(256)` on both `forms.title` and `form_sections.title`. */
const MAX_TITLE_LENGTH = 256;
const UNTITLED_FALLBACK = "Untitled";

/**
 * What happened to an item that didn't come across as-is. Each note names the
 * item it is about, so the preview can list "Upload your CV — not imported"
 * rather than a bare count; `code` is translated in the UI, never here (this
 * module is locale-free on purpose).
 */
export type MappedNoteCode =
  /** Google's dropdown has no separate representation here. */
  | "convertedDropdown"
  /** Linear scale became one choice per step. */
  | "convertedScale"
  /** Long-answer became a short answer — this app has one text type. */
  | "convertedParagraph"
  /** Date, time, file upload, rating: no equivalent, so the question is left out. */
  | "skippedUnsupported"
  /** A grid — one Google item standing for several questions. */
  | "skippedGrid"
  /** Section text, an image, or a video: not a question at all. */
  | "skippedContent"
  /** A choice question with no options to import. */
  | "skippedEmptyChoice"
  /** Google's "Other" free-text option can't be an answer row. */
  | "droppedOtherOption"
  /** A marked correct answer that matches none of the options. */
  | "unmatchedCorrectAnswer"
  /** A title longer than the column allows. */
  | "truncatedTitle";

/**
 * `id` exists because two notes can be genuinely identical — a question with
 * two unmatched correct answers produces the same code and title twice — so
 * the pair is not a usable React key and neither is the array index.
 */
export type MappedNote = {
  id: number;
  code: MappedNoteCode;
  title: string;
};

type NoteCollector = {
  list: MappedNote[];
  add: (code: MappedNoteCode, title: string) => void;
};

function createNoteCollector(): NoteCollector {
  const list: MappedNote[] = [];
  return {
    list,
    add: (code, title) => list.push({ id: list.length, code, title }),
  };
}

export type MappedAnswer = {
  text: string;
  isCorrect: boolean;
  order: number;
};

export type MappedQuestion = {
  text: string;
  type: QuestionType;
  points: number;
  order: number;
  answers: MappedAnswer[];
};

export type MappedSection = {
  title: string;
  order: number;
  questions: MappedQuestion[];
};

export type MappedForm = {
  title: string;
  description: string | null;
  isQuiz: boolean;
  sections: MappedSection[];
  notes: MappedNote[];
  questionCount: number;
};

/**
 * Turns a Google Form's structure into this app's forms/sections/questions/
 * answers shape.
 *
 * Pure — no database, no environment, no locale — so every mapping rule is
 * unit-testable against a fixture payload (the lesson D116 recorded: logic
 * that lives in a module importing `@/drizzle` can't be tested in this repo's
 * harness at all).
 *
 * Nothing is silently dropped. Anything converted to a near-equivalent or left
 * out entirely comes back in `notes`, which the preview screen lists before
 * the admin commits — phase-07.md step 5's "flagged in preview, not silently
 * dropped" requirement.
 */
export function mapGoogleForm(form: GoogleForm): MappedForm {
  const notes = createNoteCollector();
  const isQuiz = form.settings?.quizSettings?.isQuiz ?? false;
  const formTitle = truncateTitle(
    form.info.title || UNTITLED_FALLBACK,
    notes,
    form.info.title,
  );

  const sections: MappedSection[] = [];
  // Items before the first page break belong to a section Google never named,
  // so it takes the form's own title.
  let currentTitle = formTitle;
  let currentQuestions: MappedQuestion[] = [];

  const closeSection = () => {
    // A section whose every item was skipped would arrive in the builder as an
    // empty heading; the items themselves are already accounted for in notes.
    if (currentQuestions.length > 0) {
      sections.push({
        title: currentTitle,
        order: sections.length,
        questions: currentQuestions,
      });
    }
    currentQuestions = [];
  };

  for (const item of form.items ?? []) {
    if (item.pageBreakItem) {
      closeSection();
      currentTitle = truncateTitle(
        item.title || `${formTitle} (${sections.length + 1})`,
        notes,
        item.title,
      );
      continue;
    }

    const question = mapItem(item, isQuiz, currentQuestions.length, notes);
    if (question) currentQuestions.push(question);
  }

  closeSection();

  return {
    title: formTitle,
    description: form.info.description?.trim() || null,
    isQuiz,
    sections,
    notes: notes.list,
    questionCount: sections.reduce(
      (total, section) => total + section.questions.length,
      0,
    ),
  };
}

function mapItem(
  item: GoogleFormItem,
  isQuiz: boolean,
  order: number,
  notes: NoteCollector,
): MappedQuestion | null {
  const title = item.title?.trim() || UNTITLED_FALLBACK;

  if (item.questionGroupItem) {
    notes.add("skippedGrid", title);
    return null;
  }

  const question = item.questionItem?.question;
  if (!question) {
    // Text, image and video items carry no question — they are layout, and
    // this app's builder has nothing to put them in.
    if (item.textItem || item.imageItem || item.videoItem) {
      notes.add("skippedContent", title);
    } else {
      // An item kind this schema doesn't know — Google adds them over time.
      // It still gets a note: "nothing is dropped silently" has to hold for
      // the shapes we didn't anticipate too, not just the ones we did.
      notes.add("skippedUnsupported", title);
    }
    return null;
  }

  const points = resolvePoints(question, isQuiz);

  if (question.choiceQuestion) {
    return mapChoiceQuestion(question, title, points, order, notes);
  }

  if (question.scaleQuestion) {
    notes.add("convertedScale", title);
    return {
      text: title,
      type: "single_choice",
      points,
      order,
      answers: scaleAnswers(question.scaleQuestion),
    };
  }

  if (question.textQuestion) {
    if (question.textQuestion.paragraph) {
      notes.add("convertedParagraph", title);
    }
    return { text: title, type: "short_answer", points, order, answers: [] };
  }

  notes.add("skippedUnsupported", title);
  return null;
}

function mapChoiceQuestion(
  question: GoogleFormQuestion,
  title: string,
  points: number,
  order: number,
  notes: NoteCollector,
): MappedQuestion | null {
  const choice = question.choiceQuestion;
  if (!choice) return null;

  if (choice.type === "DROP_DOWN") {
    notes.add("convertedDropdown", title);
  }

  const hasOtherOption = (choice.options ?? []).some(
    (option) => option.isOther,
  );
  if (hasOtherOption) notes.add("droppedOtherOption", title);

  const correctValues = new Set(
    (question.grading?.correctAnswers?.answers ?? [])
      .map((answer) => answer.value?.trim())
      .filter((value): value is string => Boolean(value)),
  );

  const answers: MappedAnswer[] = [];
  for (const option of choice.options ?? []) {
    // `isOther` is Google's free-text escape hatch: it has no fixed text, so
    // there is nothing to store as an answer row.
    if (option.isOther) continue;
    const text = option.value?.trim();
    if (!text) continue;

    answers.push({
      text,
      isCorrect: correctValues.delete(text),
      order: answers.length,
    });
  }

  if (answers.length === 0) {
    notes.add("skippedEmptyChoice", title);
    return null;
  }

  // Whatever is left in the set matched no option — a correct answer the
  // imported question would silently lose.
  for (const _unmatched of correctValues) {
    notes.add("unmatchedCorrectAnswer", title);
  }

  return {
    text: title,
    type: choice.type === "CHECKBOX" ? "multiple_choice" : "single_choice",
    points,
    order,
    answers,
  };
}

function scaleAnswers(
  scale: NonNullable<GoogleFormQuestion["scaleQuestion"]>,
): MappedAnswer[] {
  const answers: MappedAnswer[] = [];
  const low = Math.round(scale.low);
  const high = Math.round(scale.high);

  for (let step = low; step <= high; step++) {
    // The end labels are the only wording Google carries on a scale, and
    // dropping them would leave bare numbers with no idea which end is which.
    const label =
      step === low ? scale.lowLabel : step === high ? scale.highLabel : null;

    answers.push({
      text: label ? `${step} — ${label}` : String(step),
      isCorrect: false,
      order: answers.length,
    });
  }

  return answers;
}

/**
 * A non-quiz form has no per-question points in Google, and this app's column
 * defaults to 1 — so an imported assignment scores one point per question
 * rather than zero, which is the useful default.
 */
function resolvePoints(question: GoogleFormQuestion, isQuiz: boolean): number {
  if (!isQuiz) return 1;
  const pointValue = question.grading?.pointValue;
  if (pointValue == null) return 1;
  return Math.max(0, Math.round(pointValue));
}

function truncateTitle(
  value: string,
  notes: NoteCollector,
  originalTitle: string | undefined,
): string {
  if (value.length <= MAX_TITLE_LENGTH) return value;

  notes.add("truncatedTitle", (originalTitle ?? value).slice(0, 80));
  return value.slice(0, MAX_TITLE_LENGTH);
}
