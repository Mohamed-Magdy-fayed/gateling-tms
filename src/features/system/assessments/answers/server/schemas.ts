import { z } from "zod";
import { translationKey } from "@/features/core/i18n/global";

export const listAnswersInput = z.object({
  questionId: z.uuid(),
});

// Shared between create and update so the two schemas can't silently drift.
const answerFields = {
  text: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(500, translationKey("forms.validation.max2000")),
  isCorrect: z.boolean(),
};

export const answerMutationSchema = z.object({
  questionId: z.uuid(),
  ...answerFields,
});

export const answerUpdateSchema = z.object({
  id: z.uuid(),
  ...answerFields,
});

export const answerDeleteSchema = z.object({
  id: z.uuid(),
});

export const answerMoveSchema = z.object({
  id: z.uuid(),
  direction: z.enum(["up", "down"]),
});

export type ListAnswersInput = z.infer<typeof listAnswersInput>;
export type AnswerMutationInput = z.infer<typeof answerMutationSchema>;
export type AnswerUpdateInput = z.infer<typeof answerUpdateSchema>;
export type AnswerDeleteInput = z.infer<typeof answerDeleteSchema>;
export type AnswerMoveInput = z.infer<typeof answerMoveSchema>;
