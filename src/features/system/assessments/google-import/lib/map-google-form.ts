import type { FormBlockKind, QuestionType } from "@/drizzle/schema";
import type {
  GoogleForm,
  GoogleFormItem,
  GoogleFormQuestion,
} from "@/integrations/google/forms";

/** `varchar(256)` on `forms.title`, `form_sections.title`, `form_blocks.title`. */
const MAX_TITLE_LENGTH = 256;
/** `blocks.body` is capped at 4000 by its own schema. */
const MAX_BODY_LENGTH = 4000;
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
  /** Star rating became one choice per step. */
  | "convertedRating"
  /** A grid became one question per row. */
  | "convertedGrid"
  /** File upload: no equivalent, so the question is left out. */
  | "skippedUnsupported"
  /** A choice question with no options to import. */
  | "skippedEmptyChoice"
  /** Google's "Other" free-text option can't be an answer row. */
  | "droppedOtherOption"
  /** A marked correct answer that matches none of the options. */
  | "unmatchedCorrectAnswer"
  /** An answer option had a picture; there is nowhere to put it. */
  | "droppedOptionImage"
  /** Per-answer feedback Google shows after submitting. Not stored. */
  | "droppedQuestionFeedback"
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
  kind: "question";
  text: string;
  description: string | null;
  type: QuestionType;
  points: number;
  isRequired: boolean;
  /** Google's temporary `contentUri`; the media job replaces it. */
  imageSourceUrl: string | null;
  imageAlt: string | null;
  order: number;
  answers: MappedAnswer[];
};

export type MappedBlock = {
  kind: "block";
  blockKind: FormBlockKind;
  title: string | null;
  body: string | null;
  /** Set for a video, which is embeddable as-is. Null for a pending image. */
  mediaUrl: string | null;
  /** Google's temporary `contentUri`; the media job replaces it. */
  sourceUrl: string | null;
  mediaAlt: string | null;
  order: number;
};

export type MappedItem = MappedQuestion | MappedBlock;

export type MappedSection = {
  title: string;
  order: number;
  items: MappedItem[];
};

export type MappedForm = {
  title: string;
  description: string | null;
  isQuiz: boolean;
  sections: MappedSection[];
  notes: MappedNote[];
  questionCount: number;
  blockCount: number;
};

/**
 * Turns a Google Form's structure into this app's forms/sections/questions/
 * answers/blocks shape.
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
  let currentItems: MappedItem[] = [];

  const closeSection = () => {
    // A section whose every item was skipped would arrive in the builder as an
    // empty heading; the items themselves are already accounted for in notes.
    if (currentItems.length > 0) {
      sections.push({
        title: currentTitle,
        order: sections.length,
        items: currentItems,
      });
    }
    currentItems = [];
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

    // Questions and blocks share one `order` sequence per section — that is
    // what preserves "passage, question, question, diagram" from the original
    // form rather than grouping all the reading matter at one end.
    for (const mapped of mapItem(item, isQuiz, currentItems.length, notes)) {
      currentItems.push(mapped);
    }
  }

  closeSection();

  const counted = sections.flatMap((section) => section.items);

  return {
    title: formTitle,
    description: form.info.description?.trim() || null,
    isQuiz,
    sections,
    notes: notes.list,
    questionCount: counted.filter((item) => item.kind === "question").length,
    blockCount: counted.filter((item) => item.kind === "block").length,
  };
}

/**
 * One Google item can produce zero, one, or several of ours: a grid becomes a
 * question per row, and an unsupported question becomes nothing but a note.
 */
function mapItem(
  item: GoogleFormItem,
  isQuiz: boolean,
  order: number,
  notes: NoteCollector,
): MappedItem[] {
  const title = item.title?.trim() || UNTITLED_FALLBACK;
  const description = item.description?.trim() || null;

  if (item.questionGroupItem) {
    return mapGrid(item, title, isQuiz, order, notes);
  }

  const question = item.questionItem?.question;
  if (!question) {
    const block = mapContentItem(item, title, description, order);
    if (block) return [block];

    // An item kind this schema doesn't know — Google adds them over time. It
    // still gets a note: "nothing is dropped silently" has to hold for the
    // shapes we didn't anticipate too, not just the ones we did.
    notes.add("skippedUnsupported", title);
    return [];
  }

  noteDroppedFeedback(question, title, notes);

  const base = {
    kind: "question" as const,
    text: title,
    description,
    points: resolvePoints(question, isQuiz),
    isRequired: question.required ?? false,
    imageSourceUrl: item.questionItem?.image?.contentUri ?? null,
    imageAlt: item.questionItem?.image?.altText ?? null,
    order,
  };

  if (question.choiceQuestion) {
    const mapped = mapChoiceQuestion(question, base, notes);
    return mapped ? [mapped] : [];
  }

  if (question.scaleQuestion) {
    const { low, high, lowLabel, highLabel } = question.scaleQuestion;
    const answers = stepAnswers(low, high, lowLabel, highLabel);
    // A scale with no bounds (or an inverted one) has no steps to turn into
    // options — nothing to import, so it is listed rather than added empty.
    if (answers.length === 0) {
      notes.add("skippedUnsupported", title);
      return [];
    }

    notes.add("convertedScale", title);
    return [{ ...base, type: "single_choice", answers }];
  }

  if (question.ratingQuestion) {
    // Stars out of N is a choice among fixed steps, exactly like a scale —
    // the icon is the only thing that differs, and this app has no icons.
    const answers = stepAnswers(1, question.ratingQuestion.ratingScaleLevel);
    if (answers.length === 0) {
      notes.add("skippedUnsupported", title);
      return [];
    }

    notes.add("convertedRating", title);
    return [{ ...base, type: "single_choice", answers }];
  }

  const textType = resolveTextType(question);
  if (textType) {
    return [
      {
        ...base,
        type: textType,
        // Google quizzes can carry accepted answers for typed questions, and
        // this app grades against exactly that (`evaluateShortAnswer`). They
        // used to be dropped without even a note.
        answers: acceptedAnswers(question),
      },
    ];
  }

  // File upload: there is no upload path in a response, so importing one would
  // create a question nobody can answer.
  notes.add("skippedUnsupported", title);
  return [];
}

/** Text, image and video items — the parts of a form that aren't questions. */
function mapContentItem(
  item: GoogleFormItem,
  title: string,
  description: string | null,
  order: number,
): MappedBlock | null {
  const base = {
    kind: "block" as const,
    title: item.title?.trim() ? truncate(title, MAX_TITLE_LENGTH) : null,
    order,
  };

  if (item.textItem) {
    // A Google text item has no fields of its own: the heading is the item's
    // title and the prose is its description.
    return {
      ...base,
      blockKind: "text",
      body: description ? truncate(description, MAX_BODY_LENGTH) : null,
      mediaUrl: null,
      sourceUrl: null,
      mediaAlt: null,
    };
  }

  if (item.imageItem) {
    return {
      ...base,
      blockKind: "image",
      body: null,
      // Deliberately null: `contentUri` expires, so nothing renders it. The
      // media job fills this in once it has copied the bytes to our storage.
      mediaUrl: null,
      sourceUrl: item.imageItem.image?.contentUri ?? null,
      mediaAlt: item.imageItem.image?.altText ?? description ?? null,
    };
  }

  if (item.videoItem) {
    const embedUrl = youTubeEmbedUrl(item.videoItem.video?.youtubeUri);
    if (!embedUrl) return null;

    return {
      ...base,
      blockKind: "video",
      body: item.videoItem.caption?.trim() || null,
      // A YouTube URL doesn't expire, so there is nothing to copy — the embed
      // is usable the moment the import commits.
      mediaUrl: embedUrl,
      sourceUrl: null,
      mediaAlt: null,
    };
  }

  return null;
}

/**
 * A grid is one Google item standing for several questions: every row asks the
 * same set of columns. It used to be skipped whole; each row is a question of
 * its own here, which is what the form actually asks.
 */
function mapGrid(
  item: GoogleFormItem,
  title: string,
  isQuiz: boolean,
  order: number,
  notes: NoteCollector,
): MappedItem[] {
  const group = item.questionGroupItem;
  const columns = group?.grid?.columns;
  const rows = group?.questions ?? [];

  if (!columns || rows.length === 0) {
    notes.add("skippedUnsupported", title);
    return [];
  }

  notes.add("convertedGrid", title);

  const items: MappedItem[] = [];
  for (const row of rows) {
    const rowTitle = row.rowQuestion?.title?.trim();
    // The grid's own title is the question; the row is which case of it. Both
    // are needed — "Rate the following: Punctuality" reads, "Punctuality"
    // alone doesn't once the rows are separate questions.
    const text = truncate(
      rowTitle ? `${title} — ${rowTitle}` : title,
      MAX_TITLE_LENGTH,
    );

    const mapped = mapChoiceQuestion(
      // The row carries its own grading and required flag; the columns are
      // shared, so the choice definition comes from the grid.
      { ...row, choiceQuestion: columns },
      {
        kind: "question" as const,
        text,
        description: item.description?.trim() || null,
        points: resolvePoints(row, isQuiz),
        isRequired: row.required ?? false,
        imageSourceUrl: null,
        imageAlt: null,
        order: order + items.length,
      },
      notes,
    );

    if (mapped) items.push(mapped);
  }

  return items;
}

type QuestionBase = Omit<MappedQuestion, "type" | "answers">;

function mapChoiceQuestion(
  question: GoogleFormQuestion,
  base: QuestionBase,
  notes: NoteCollector,
): MappedQuestion | null {
  const choice = question.choiceQuestion;
  if (!choice) return null;

  if (choice.type === "DROP_DOWN") {
    notes.add("convertedDropdown", base.text);
  }

  const options = choice.options ?? [];
  if (options.some((option) => option.isOther)) {
    notes.add("droppedOtherOption", base.text);
  }
  if (options.some((option) => option.image)) {
    notes.add("droppedOptionImage", base.text);
  }

  const correctValues = new Set(
    (question.grading?.correctAnswers?.answers ?? [])
      .map((answer) => answer.value?.trim())
      .filter((value): value is string => Boolean(value)),
  );

  const answers: MappedAnswer[] = [];
  for (const option of options) {
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
    notes.add("skippedEmptyChoice", base.text);
    return null;
  }

  // Whatever is left in the set matched no option — a correct answer the
  // imported question would silently lose.
  for (const _unmatched of correctValues) {
    notes.add("unmatchedCorrectAnswer", base.text);
  }

  return {
    ...base,
    type: choice.type === "CHECKBOX" ? "multiple_choice" : "single_choice",
    answers,
  };
}

/** Which typed question this is, or null if it isn't one. */
function resolveTextType(question: GoogleFormQuestion): QuestionType | null {
  if (question.textQuestion) {
    return question.textQuestion.paragraph ? "long_answer" : "short_answer";
  }
  if (question.dateQuestion) return "date";
  if (question.timeQuestion) return "time";
  return null;
}

/**
 * The wordings a Google quiz accepts for a typed question, stored as answer
 * rows — the same shape `answers/server/mutations.ts` writes by hand and
 * `evaluateShortAnswer` grades against.
 */
function acceptedAnswers(question: GoogleFormQuestion): MappedAnswer[] {
  const values = (question.grading?.correctAnswers?.answers ?? [])
    .map((answer) => answer.value?.trim())
    .filter((value): value is string => Boolean(value));

  return values.map((text, index) => ({
    text,
    isCorrect: true,
    order: index,
  }));
}

/**
 * One option per integer step, shared by linear scales and star ratings. The
 * end labels are the only wording Google carries, and dropping them would
 * leave bare numbers with no idea which end is which.
 */
function stepAnswers(
  low: number | undefined,
  high: number | undefined,
  lowLabel?: string,
  highLabel?: string,
): MappedAnswer[] {
  if (low == null || high == null) return [];

  const first = Math.round(low);
  const last = Math.round(high);
  if (last < first) return [];

  const answers: MappedAnswer[] = [];
  for (let step = first; step <= last; step++) {
    const label =
      step === first ? lowLabel : step === last ? highLabel : undefined;

    answers.push({
      text: label ? `${step} — ${label}` : String(step),
      isCorrect: false,
      order: answers.length,
    });
  }

  return answers;
}

/**
 * The embeddable form of a YouTube link, or null if it isn't one.
 *
 * `youtube-nocookie.com` because it is what the CSP's `frame-src` allows and
 * it sets no advertising cookies on a page students are told to visit for a
 * class. Watch, share and embed URLs all carry the id in a different place.
 */
export function youTubeEmbedUrl(uri: string | undefined): string | null {
  if (!uri) return null;

  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "");
  const id =
    host === "youtu.be"
      ? parsed.pathname.slice(1)
      : host === "youtube.com" || host === "youtube-nocookie.com"
        ? (parsed.searchParams.get("v") ??
          parsed.pathname.replace(/^\/(embed|v)\//, ""))
        : null;

  // Video ids are 11 characters of the URL-safe base64 alphabet. Checking is
  // what stops a crafted "youtube.com" path becoming an arbitrary iframe src.
  if (!id || !/^[\w-]{11}$/.test(id)) return null;

  return `https://www.youtube-nocookie.com/embed/${id}`;
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

/** Google's after-submission feedback has nowhere to live in this app. */
function noteDroppedFeedback(
  question: GoogleFormQuestion,
  title: string,
  notes: NoteCollector,
) {
  const grading = question.grading;
  if (grading?.whenRight || grading?.whenWrong || grading?.generalFeedback) {
    notes.add("droppedQuestionFeedback", title);
  }
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max);
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
