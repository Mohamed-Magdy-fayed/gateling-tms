import { z } from "zod";
import { translationKey } from "@/features/core/i18n/global";
import {
  MAX_IMPORT_BASE64_LENGTH,
  MAX_IMPORT_ROWS,
} from "@/features/core/import/lib";

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

/**
 * One row of an uploaded levels template. Every cell stays a string, the same
 * convention the other import row schemas follow — `order` is turned into a
 * number at commit time, once the row is known to be committable.
 */
export const levelImportRowSchema = z.object({
  id: z
    .string()
    .trim()
    .pipe(
      z.union([
        z.uuid(translationKey("import.validation.invalidId")),
        z.literal(""),
      ]),
    ),
  courseName: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(256, translationKey("forms.validation.max256")),
  name: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(256, translationKey("forms.validation.max256")),
  // Six digits is far beyond any real course, and keeps the parsed value well
  // inside the integer column it ends up in.
  order: z
    .string()
    .trim()
    .pipe(
      z.union([
        z
          .string()
          .regex(/^\d{1,6}$/, translationKey("import.validation.invalidOrder")),
        z.literal(""),
      ]),
    ),
});

export const levelImportPreviewInput = z.object({
  fileName: z.string().min(1).max(256),
  base64: z.string().min(1).max(MAX_IMPORT_BASE64_LENGTH),
});

export const levelImportCommitInput = z.object({
  rows: z.array(z.record(z.string(), z.string())).min(1).max(MAX_IMPORT_ROWS),
});

export type ListLevelsInput = z.infer<typeof listLevelsInput>;
export type LevelImportRow = z.infer<typeof levelImportRowSchema>;
export type LevelImportPreviewInput = z.infer<typeof levelImportPreviewInput>;
export type LevelImportCommitInput = z.infer<typeof levelImportCommitInput>;
export type LevelMutationInput = z.infer<typeof levelMutationSchema>;
export type LevelUpdateInput = z.infer<typeof levelUpdateSchema>;
export type LevelDeleteInput = z.infer<typeof levelDeleteSchema>;
export type LevelMoveInput = z.infer<typeof levelMoveSchema>;
