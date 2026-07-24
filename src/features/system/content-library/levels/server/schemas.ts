import { z } from "zod";
import { translationKey } from "@/features/core/i18n/global";

export const listLevelsInput = z.object({
  courseId: z.uuid(),
});

export const levelMutationSchema = z.object({
  courseId: z.uuid(),
  name: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(256, translationKey("forms.validation.max256")),
});

export const levelUpdateSchema = z.object({
  id: z.uuid(),
  name: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(256, translationKey("forms.validation.max256")),
});

export const levelDeleteSchema = z.object({
  id: z.uuid(),
});

export const levelMoveSchema = z.object({
  id: z.uuid(),
  direction: z.enum(["up", "down"]),
});

export type ListLevelsInput = z.infer<typeof listLevelsInput>;
export type LevelMutationInput = z.infer<typeof levelMutationSchema>;
export type LevelUpdateInput = z.infer<typeof levelUpdateSchema>;
export type LevelDeleteInput = z.infer<typeof levelDeleteSchema>;
export type LevelMoveInput = z.infer<typeof levelMoveSchema>;
