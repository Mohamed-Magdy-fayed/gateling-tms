import { z } from "zod";
import { translationKey } from "@/features/core/i18n/global";
import { idSchema } from "@/lib/id-schema";

export const listTraineeNotesInput = z.object({
  traineeId: idSchema,
});

const noteBody = z
  .string()
  .trim()
  .min(1, translationKey("forms.validation.required"))
  .max(4000, translationKey("forms.validation.max4000"));

// Plain schema, no `.default()`/`.transform()`, so the client form and the
// server can share it (STATE.md D82).
export const traineeNoteMutationSchema = z.object({
  traineeId: idSchema,
  body: noteBody,
});

export const traineeNoteUpdateSchema = z.object({
  id: idSchema,
  body: noteBody,
});

export const traineeNoteDeleteSchema = z.object({
  id: idSchema,
});

export type ListTraineeNotesInput = z.infer<typeof listTraineeNotesInput>;
export type TraineeNoteMutationInput = z.infer<
  typeof traineeNoteMutationSchema
>;
export type TraineeNoteUpdateInput = z.infer<typeof traineeNoteUpdateSchema>;
export type TraineeNoteDeleteInput = z.infer<typeof traineeNoteDeleteSchema>;
