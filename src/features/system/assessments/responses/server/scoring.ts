import type { FormResponseAnswer, QuestionType } from "@/drizzle/schema";

export type ScorableQuestion = {
  id: string;
  type: QuestionType;
  points: number;
  answers: { id: string; isCorrect: boolean }[];
};

/**
 * Auto-scores a response against a form's question tree. Returns `null`
 * (needs manual grading) the moment any question is `short_answer` — mixing
 * an auto-computed partial score with ungraded short answers would just be
 * misleading, so the whole response stays ungraded until every question can
 * be auto-scored (matches `form_responses.score`'s own column comment).
 *
 * A choice question only counts as correct on an exact match between the
 * submitted `selectedAnswerIds` and the question's `isCorrect` answers —
 * partial credit for multi-select isn't part of this phase's scope.
 */
export function scoreFormResponse(
  questions: ScorableQuestion[],
  answers: FormResponseAnswer[],
): number | null {
  if (questions.some((question) => question.type === "short_answer")) {
    return null;
  }

  let total = 0;
  for (const question of questions) {
    const submitted = answers.find((a) => a.questionId === question.id);
    const correctIds = new Set(
      question.answers.filter((a) => a.isCorrect).map((a) => a.id),
    );
    const selectedIds = new Set(submitted?.selectedAnswerIds ?? []);
    const matches =
      correctIds.size === selectedIds.size &&
      [...correctIds].every((id) => selectedIds.has(id));
    if (matches) total += question.points;
  }
  return total;
}
