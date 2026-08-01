import {
  type FormResponseAnswer,
  isTextQuestion,
  type QuestionType,
} from "@/drizzle/schema";

export type ScorableAnswer = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type ScorableQuestion = {
  id: string;
  text: string;
  type: QuestionType;
  points: number;
  answers: ScorableAnswer[];
};

/**
 * Verdicts for short answers the deterministic pass couldn't settle, keyed by
 * question id. A missing entry means *no verdict*, not "incorrect".
 */
export type ShortAnswerVerdicts = ReadonlyMap<string, boolean>;

/** Tatweel plus the tashkeel range — decoration that carries no meaning. */
const ARABIC_DECORATION = /[ـً-ْٰ]/g;
const COMBINING_MARKS = /\p{M}+/gu;
const PUNCTUATION = /[\p{P}\p{S}]+/gu;
const WHITESPACE = /\s+/g;

/**
 * Folds away the differences that never distinguish a right answer from a
 * wrong one — case, surrounding and repeated whitespace, punctuation, Latin
 * accents, and the Arabic spelling variants people type interchangeably
 * (hamza forms of alef, ya/alef maqsura, ta marbuta/ha).
 *
 * This is the free half of grading: anything it settles costs no model call.
 */
export function normalizeAnswerText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .replace(ARABIC_DECORATION, "")
    .replace(/[آأإٱ]/g, "ا") // آ أ إ ٱ → ا
    .replace(/ى/g, "ي") // ى → ي
    .replace(/ة/g, "ه") // ة → ه
    .replace(/ؤ/g, "و") // ؤ → و
    .replace(/ئ/g, "ي") // ئ → ي
    .replace(PUNCTUATION, " ")
    .replace(WHITESPACE, " ")
    .trim()
    .toLowerCase();
}

/**
 * The highest score a response to this question tree can earn — the ceiling a
 * manual grade is checked against, so a typo can't record 500/10.
 */
export function sumQuestionPoints(questions: ScorableQuestion[]): number {
  return questions.reduce((total, question) => total + question.points, 0);
}

export type ShortAnswerOutcome =
  /** Matched an accepted answer outright, or was left blank. */
  | { kind: "settled"; isCorrect: boolean }
  /** No accepted answers configured — nothing to grade against. */
  | { kind: "unanswerable" }
  /** Plausible but not an exact match; only a model can judge it. */
  | { kind: "needsModel"; acceptedAnswers: string[]; submittedText: string };

/**
 * Decides how far a short answer can be graded without a model. Shared by the
 * scorer and by the code that builds the model request, so both agree on
 * exactly which questions warrant a call.
 */
export function evaluateShortAnswer(
  question: ScorableQuestion,
  submittedText: string | undefined,
): ShortAnswerOutcome {
  const acceptedAnswers = question.answers
    .filter((answer) => answer.isCorrect)
    .map((answer) => answer.text);

  // A teacher who hasn't marked any answer as accepted hasn't finished
  // authoring the question — grading it either way would be a guess.
  if (acceptedAnswers.length === 0) return { kind: "unanswerable" };

  const normalized = normalizeAnswerText(submittedText ?? "");
  // Nothing to interpret in a blank answer — settle it here rather than
  // spending a model call to be told it's wrong.
  if (normalized.length === 0) return { kind: "settled", isCorrect: false };

  const isExactMatch = acceptedAnswers.some(
    (accepted) => normalizeAnswerText(accepted) === normalized,
  );
  if (isExactMatch) return { kind: "settled", isCorrect: true };

  return {
    kind: "needsModel",
    acceptedAnswers,
    submittedText: submittedText ?? "",
  };
}

/**
 * Auto-scores a response against a form's question tree.
 *
 * Returns `null` — "needs manual grading" — when any single question can't be
 * graded: a short answer with no accepted answers configured, or one the
 * normalisation pass couldn't settle and for which `verdicts` carries no
 * entry (no model key, or the call failed). A partial score would read as a
 * real one, so the whole response stays ungraded instead.
 *
 * Pure and synchronous by design: the model call happens in `grading.ts`,
 * before this runs, so scoring stays testable and can run inside a
 * transaction without holding a lock across a network round trip.
 *
 * A choice question only counts as correct on an exact match between the
 * submitted `selectedAnswerIds` and the question's `isCorrect` answers —
 * partial credit for multi-select isn't part of this phase's scope.
 */
export function scoreFormResponse(
  questions: ScorableQuestion[],
  answers: FormResponseAnswer[],
  verdicts: ShortAnswerVerdicts = new Map(),
): number | null {
  let total = 0;
  let hasUngraded = false;

  for (const question of questions) {
    const submitted = answers.find((a) => a.questionId === question.id);

    if (isTextQuestion(question.type)) {
      const outcome = evaluateShortAnswer(question, submitted?.text);

      if (outcome.kind === "unanswerable") {
        hasUngraded = true;
        continue;
      }
      if (outcome.kind === "settled") {
        if (outcome.isCorrect) total += question.points;
        continue;
      }

      const verdict = verdicts.get(question.id);
      // Absent verdict means the model never ruled on it — treating that as
      // "wrong" would silently mark a correct paraphrase down.
      if (verdict === undefined) {
        hasUngraded = true;
        continue;
      }
      if (verdict) total += question.points;
      continue;
    }

    const correctIds = new Set(
      question.answers.filter((a) => a.isCorrect).map((a) => a.id),
    );
    const selectedIds = new Set(submitted?.selectedAnswerIds ?? []);
    // `correctIds.size > 0` guards against a misconfigured/unanswered
    // question with no correct answer marked at all — without it, an empty
    // selected set trivially matches an empty correct set and awards full
    // points for nothing.
    const matches =
      correctIds.size > 0 &&
      correctIds.size === selectedIds.size &&
      [...correctIds].every((id) => selectedIds.has(id));
    if (matches) total += question.points;
  }

  return hasUngraded ? null : total;
}
