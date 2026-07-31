import { z } from "zod";
import { translationKey } from "@/features/core/i18n/global";

export const listResponsesInput = z.object({
  formId: z.uuid(),
});

const formResponseAnswerSchema = z.object({
  questionId: z.uuid(),
  selectedAnswerIds: z.array(z.uuid()).optional(),
  text: z
    .string()
    .trim()
    .max(2000, translationKey("forms.validation.max2000"))
    .optional(),
});

export const submitResponseSchema = z.object({
  formId: z.uuid(),
  answers: z
    .array(formResponseAnswerSchema)
    .min(1, translationKey("forms.validation.required")),
});

export const gradingSheetInput = z.object({
  responseId: z.uuid(),
});

/**
 * A grader's own score for a response the automatic pass left ungraded.
 *
 * The upper bound is the form's total points, which isn't known here — the
 * mutation checks it against the question tree it loads anyway.
 */
export const gradeResponseSchema = z.object({
  responseId: z.uuid(),
  // The message covers a cleared number input, which arrives as null.
  score: z.number(translationKey("forms.validation.required")).int().min(0),
});

export type GradeResponseInput = z.infer<typeof gradeResponseSchema>;
export type GradingSheetInput = z.infer<typeof gradingSheetInput>;
export type ListResponsesInput = z.infer<typeof listResponsesInput>;
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
