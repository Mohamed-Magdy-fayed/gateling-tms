import "server-only";

import { type FormResponseAnswer, isTextQuestion } from "@/drizzle/schema";
import {
  matchShortAnswers,
  type ShortAnswerMatchRequest,
} from "@/integrations/gemini";

import {
  evaluateShortAnswer,
  type ScorableQuestion,
  type ShortAnswerVerdicts,
  scoreFormResponse,
} from "./scoring";

/**
 * Asks the model about the short answers the deterministic pass couldn't
 * settle — and only those, so a form of exact matches costs nothing.
 *
 * Split out from `gradeFormResponse` because this is the only part that talks
 * to the network: callers that score inside a database transaction must run
 * this **before** opening it, so no row lock is held across the round trip
 * (see the placement-test attempt flow).
 */
export async function computeShortAnswerVerdicts(
  questions: ScorableQuestion[],
  answers: FormResponseAnswer[],
): Promise<ShortAnswerVerdicts> {
  const requests: ShortAnswerMatchRequest[] = [];

  for (const question of questions) {
    if (!isTextQuestion(question.type)) continue;
    const submitted = answers.find((a) => a.questionId === question.id);
    const outcome = evaluateShortAnswer(question, submitted?.text);
    if (outcome.kind !== "needsModel") continue;

    requests.push({
      questionId: question.id,
      questionText: question.text,
      acceptedAnswers: outcome.acceptedAnswers,
      submittedText: outcome.submittedText,
    });
  }

  if (requests.length === 0) return new Map();
  return matchShortAnswers(requests);
}

/**
 * Grades a response end to end: normalise, ask the model about what's left,
 * then score. Use this wherever scoring isn't inside a transaction.
 */
export async function gradeFormResponse(
  questions: ScorableQuestion[],
  answers: FormResponseAnswer[],
): Promise<number | null> {
  const verdicts = await computeShortAnswerVerdicts(questions, answers);
  return scoreFormResponse(questions, answers, verdicts);
}
