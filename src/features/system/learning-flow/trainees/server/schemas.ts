import { z } from "zod";
import { translationKey } from "@/features/core/i18n/global";
import {
  MAX_IMPORT_BASE64_LENGTH,
  MAX_IMPORT_ROWS,
} from "@/features/core/import/lib";
import { idSchema } from "@/lib/id-schema";

export const listTraineesInput = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).default([]),
  globalFilter: z.string().optional(),
});

export const traineeMutationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(256, translationKey("forms.validation.max256")),
  phone: z
    .string()
    .trim()
    .max(32, translationKey("forms.validation.max32"))
    .optional()
    .or(z.literal("")),
  email: z
    .email(translationKey("auth.validation.invalidEmail"))
    .optional()
    .or(z.literal("")),
});

export const traineeUpdateSchema = traineeMutationSchema.extend({
  id: idSchema,
});

export const traineeDeleteSchema = z.object({
  id: idSchema,
});

/**
 * One row of an uploaded students template. Every cell arrives as a string
 * (blank when the column is absent or empty), so optional columns are modelled
 * as "a value or the empty string" rather than `.optional()` — the parsed row
 * then has a total, string-keyed shape the commit path can rely on.
 */
export const traineeImportRowSchema = z.object({
  // `id` and `email` trim before the "or empty" branch: the file path already
  // trims every cell, but `importCommit` validates rows straight off the
  // client, and a whitespace-only value there would fail both branches
  // instead of reading as "not given".
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
  phone: z.string().trim().max(32, translationKey("forms.validation.max32")),
  email: z
    .string()
    .trim()
    .pipe(
      z.union([
        z.email(translationKey("auth.validation.invalidEmail")),
        z.literal(""),
      ]),
    ),
  groupName: z
    .string()
    .trim()
    .max(256, translationKey("forms.validation.max256")),
});

export const traineeImportPreviewInput = z.object({
  fileName: z.string().min(1).max(256),
  base64: z.string().min(1).max(MAX_IMPORT_BASE64_LENGTH),
});

export const traineeImportCommitInput = z.object({
  rows: z.array(z.record(z.string(), z.string())).min(1).max(MAX_IMPORT_ROWS),
});

export type ListTraineesInput = z.infer<typeof listTraineesInput>;
export type TraineeImportRow = z.infer<typeof traineeImportRowSchema>;
export type TraineeImportPreviewInput = z.infer<
  typeof traineeImportPreviewInput
>;
export type TraineeImportCommitInput = z.infer<typeof traineeImportCommitInput>;
export type TraineeMutationInput = z.infer<typeof traineeMutationSchema>;
export type TraineeUpdateInput = z.infer<typeof traineeUpdateSchema>;
export type TraineeDeleteInput = z.infer<typeof traineeDeleteSchema>;
