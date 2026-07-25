import { z } from "zod";
import { translationKey } from "@/features/core/i18n/global";

export const listSectionsInput = z.object({
  formId: z.uuid(),
});

// Shared between create and update so the two schemas can't silently drift.
const sectionFields = {
  title: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(256, translationKey("forms.validation.max256")),
};

export const sectionMutationSchema = z.object({
  formId: z.uuid(),
  ...sectionFields,
});

export const sectionUpdateSchema = z.object({
  id: z.uuid(),
  ...sectionFields,
});

export const sectionDeleteSchema = z.object({
  id: z.uuid(),
});

export const sectionMoveSchema = z.object({
  id: z.uuid(),
  direction: z.enum(["up", "down"]),
});

export type ListSectionsInput = z.infer<typeof listSectionsInput>;
export type SectionMutationInput = z.infer<typeof sectionMutationSchema>;
export type SectionUpdateInput = z.infer<typeof sectionUpdateSchema>;
export type SectionDeleteInput = z.infer<typeof sectionDeleteSchema>;
export type SectionMoveInput = z.infer<typeof sectionMoveSchema>;
