import { z } from "zod";
import { questionTypeValues } from "@/drizzle/schema";
import { translationKey } from "@/features/core/i18n/global";
import { mediaUrlSchema } from "@/features/system/assessments/lib/media-url";

export const listQuestionsInput = z.object({
  sectionId: z.uuid(),
});

// Shared between create and update so the two schemas can't silently drift.
//
// The optional fields are `""`-or-value rather than `.optional()`: TanStack
// Form needs a validator whose input type matches its form values exactly, so
// an empty text input has to be a valid value here and gets normalized to null
// by the mutation — same reasoning as groups' `optionalReference`.
const questionFields = {
  text: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(2000, translationKey("forms.validation.max2000")),
  description: z
    .string()
    .trim()
    .max(2000, translationKey("forms.validation.max2000")),
  type: z.enum(questionTypeValues),
  points: z.number().int().min(0).max(1000),
  isRequired: z.boolean(),
  imageUrl: mediaUrlSchema,
  imageAlt: z.string().trim().max(256, translationKey("forms.validation.max256")),
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
