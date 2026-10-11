import { z } from "zod";
import { translationKey } from "@/features/core/i18n/global";
import {
  MAX_IMPORT_BASE64_LENGTH,
  MAX_IMPORT_ROWS,
} from "@/features/core/import/lib";

export const listCoursesInput = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).default([]),
  globalFilter: z.string().optional(),
});

export const courseMutationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(256, translationKey("forms.validation.max256")),
  description: z
    .string()
    .trim()
    .max(2000, translationKey("forms.validation.max2000"))
    .optional()
    .or(z.literal("")),
  thumbnailUrl: z.url().optional().or(z.literal("")).nullable(),
});

export const courseUpdateSchema = courseMutationSchema.extend({
  id: z.uuid(),
});

export const courseDeleteSchema = z.object({
  id: z.uuid(),
});

/**
 * One row of an uploaded courses template. Every cell arrives as a string
 * (blank when the column is absent or empty), so optional columns are modelled
 * as "a value or the empty string" rather than `.optional()`, and `id` trims
 * before that branch — `importCommit` validates rows straight off the client,
 * where a whitespace-only value would otherwise fail both branches instead of
 * reading as "not given".
 */
export const courseImportRowSchema = z.object({
  id: z
    .string()
    .trim()
    .pipe(
      z.union([
        z.uuid(translationKey("import.validation.invalidId")),
        z.literal(""),
      ]),
    ),
  name: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(256, translationKey("forms.validation.max256")),
  description: z
    .string()
    .trim()
    .max(2000, translationKey("forms.validation.max2000")),
});

export const courseImportPreviewInput = z.object({
  fileName: z.string().min(1).max(256),
  base64: z.string().min(1).max(MAX_IMPORT_BASE64_LENGTH),
});

export const courseImportCommitInput = z.object({
  rows: z.array(z.record(z.string(), z.string())).min(1).max(MAX_IMPORT_ROWS),
});

export type ListCoursesInput = z.infer<typeof listCoursesInput>;
export type CourseImportRow = z.infer<typeof courseImportRowSchema>;
export type CourseImportPreviewInput = z.infer<typeof courseImportPreviewInput>;
export type CourseImportCommitInput = z.infer<typeof courseImportCommitInput>;
export type CourseMutationInput = z.infer<typeof courseMutationSchema>;
export type CourseUpdateInput = z.infer<typeof courseUpdateSchema>;
export type CourseDeleteInput = z.infer<typeof courseDeleteSchema>;
