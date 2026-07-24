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

export type ListResponsesInput = z.infer<typeof listResponsesInput>;
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
