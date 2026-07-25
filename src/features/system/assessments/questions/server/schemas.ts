import { z } from "zod";
import { questionTypeValues } from "@/drizzle/schema";
import { translationKey } from "@/features/core/i18n/global";

export const listQuestionsInput = z.object({
  sectionId: z.uuid(),
});

// Shared between create and update so the two schemas can't silently drift.
const questionFields = {
  text: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(2000, translationKey("forms.validation.max2000")),
  type: z.enum(questionTypeValues),
  points: z.number().int().min(0).max(1000),
};

export const questionMutationSchema = z.object({
  sectionId: z.uuid(),
  ...questionFields,
});

export const questionUpdateSchema = z.object({
  id: z.uuid(),
  ...questionFields,
});

export const questionDeleteSchema = z.object({
  id: z.uuid(),
});

export const questionMoveSchema = z.object({
  id: z.uuid(),
  direction: z.enum(["up", "down"]),
});

export type ListQuestionsInput = z.infer<typeof listQuestionsInput>;
export type QuestionMutationInput = z.infer<typeof questionMutationSchema>;
export type QuestionUpdateInput = z.infer<typeof questionUpdateSchema>;
export type QuestionDeleteInput = z.infer<typeof questionDeleteSchema>;
export type QuestionMoveInput = z.infer<typeof questionMoveSchema>;
