import { z } from "zod";
import {
  enrollmentLevelStatusValues,
  enrollmentStatusValues,
} from "@/drizzle/schema";
import { translationKey } from "@/features/core/i18n/global";
import {
  MAX_IMPORT_BASE64_LENGTH,
  MAX_IMPORT_ROWS,
} from "@/features/core/import/lib";
import { idSchema } from "@/lib/id-schema";

export const listEnrollmentsInput = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).default([]),
  globalFilter: z.string().optional(),
  // Set by the trainee detail page, which lists only that trainee's
  // enrollments; omitted by the cross-trainee table.
  traineeId: idSchema.optional(),
  status: z.enum(enrollmentStatusValues).optional(),
});

export const enrollmentTraineeModeValues = ["existing", "new"] as const;

/**
 * Deliberately no `.default()` and no `.transform()` — TanStack Form needs a
 * validator whose input and output types match its form values exactly, and
 * either one makes the input type optional (STATE.md D82). Keeping the schema
 * plain lets the client and the server share it.
 *
 * The trainee is either picked (`existing` → `traineeId`) or typed in on the
 * spot (`new` → `newTrainee`), so staff don't have to leave the enrollment
 * form to add a student first. Both branches are always present in the value
 * — a discriminated union would make the form's field names differ per branch
 * — and the mode decides which one `superRefine` requires. The unused branch is
 * ignored by the server, never validated, so a half-typed name left behind
 * when switching back to "existing" can't block the submit.
 */
export const enrollmentMutationSchema = z
  .object({
    traineeMode: z.enum(enrollmentTraineeModeValues),
    traineeId: z.string(),
    newTrainee: z.object({
      name: z
        .string()
        .trim()
        .max(256, translationKey("forms.validation.max256")),
      phone: z
        .string()
        .trim()
        .max(32, translationKey("forms.validation.max32")),
      email: z.string().trim(),
    }),
    courseId: z.uuid(translationKey("forms.validation.required")),
    status: z.enum(enrollmentStatusValues),
  })
  .superRefine((value, ctx) => {
    if (value.traineeMode === "existing") {
      if (!z.uuid().safeParse(value.traineeId).success) {
        ctx.addIssue({
          code: "custom",
          path: ["traineeId"],
          message: translationKey("forms.validation.required"),
        });
      }
      return;
    }

    if (value.newTrainee.name.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["newTrainee", "name"],
        message: translationKey("forms.validation.required"),
      });
    }
    if (
      value.newTrainee.email.length > 0 &&
      !z.email().safeParse(value.newTrainee.email).success
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["newTrainee", "email"],
        message: translationKey("auth.validation.invalidEmail"),
      });
    }
  });

/**
 * Trainee and course are an enrollment's identity — changing either would
 * silently rewrite history rather than edit it, so only the status moves.
 */
export const enrollmentStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(enrollmentStatusValues),
});

export const enrollmentDeleteSchema = z.object({
  id: z.uuid(),
});

export const enrollmentLevelStatusSchema = z.object({
  enrollmentId: z.uuid(),
  levelId: z.uuid(),
  status: z.enum(enrollmentLevelStatusValues),
});

/**
 * One row of an uploaded enrollments template. Every cell stays a string, so a
 * blank status reads as "not given" — which means `waiting` on a new
 * enrollment and "leave it alone" on an existing one.
 */
export const enrollmentImportRowSchema = z.object({
  id: z
    .string()
    .trim()
    .pipe(
      z.union([
        z.uuid(translationKey("import.validation.invalidId")),
        z.literal(""),
      ]),
    ),
  traineeEmail: z
    .string()
    .trim()
    .pipe(
      z.union([
        z.email(translationKey("auth.validation.invalidEmail")),
        z.literal(""),
      ]),
    ),
  traineeName: z
    .string()
    .trim()
    .max(256, translationKey("forms.validation.max256")),
  courseName: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(256, translationKey("forms.validation.max256")),
  // The message sits on the union rather than on the enum: when every branch
  // fails, Zod reports the union's own error, not the branch's.
  status: z
    .string()
    .trim()
    .pipe(
      z.union(
        [z.enum(enrollmentStatusValues), z.literal("")],
        translationKey("import.validation.invalidStatus"),
      ),
    ),
});

export const enrollmentImportPreviewInput = z.object({
  fileName: z.string().min(1).max(256),
  base64: z.string().min(1).max(MAX_IMPORT_BASE64_LENGTH),
});

export const enrollmentImportCommitInput = z.object({
  rows: z.array(z.record(z.string(), z.string())).min(1).max(MAX_IMPORT_ROWS),
});

export type ListEnrollmentsInput = z.infer<typeof listEnrollmentsInput>;
export type EnrollmentImportRow = z.infer<typeof enrollmentImportRowSchema>;
export type EnrollmentImportPreviewInput = z.infer<
  typeof enrollmentImportPreviewInput
>;
export type EnrollmentImportCommitInput = z.infer<
  typeof enrollmentImportCommitInput
>;
export type EnrollmentMutationInput = z.infer<typeof enrollmentMutationSchema>;
export type EnrollmentTraineeMode =
  (typeof enrollmentTraineeModeValues)[number];
export type EnrollmentStatusInput = z.infer<typeof enrollmentStatusSchema>;
export type EnrollmentDeleteInput = z.infer<typeof enrollmentDeleteSchema>;
export type EnrollmentLevelStatusInput = z.infer<
  typeof enrollmentLevelStatusSchema
>;
