import { z } from "zod";
import {
  enrollmentLevelStatusValues,
  enrollmentStatusValues,
} from "@/drizzle/schema";
import { translationKey } from "@/features/core/i18n/global";

export const listEnrollmentsInput = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).default([]),
  globalFilter: z.string().optional(),
  // Set by the trainee detail page, which lists only that trainee's
  // enrollments; omitted by the cross-trainee table.
  traineeId: z.uuid().optional(),
  status: z.enum(enrollmentStatusValues).optional(),
});

/**
 * Deliberately no `.default()` and no `.transform()` — TanStack Form needs a
 * validator whose input and output types match its form values exactly, and
 * either one makes the input type optional (STATE.md D82). Keeping the schema
 * plain lets the client and the server share it.
 */
export const enrollmentMutationSchema = z.object({
  traineeId: z.uuid(translationKey("forms.validation.required")),
  courseId: z.uuid(translationKey("forms.validation.required")),
  status: z.enum(enrollmentStatusValues),
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

export type ListEnrollmentsInput = z.infer<typeof listEnrollmentsInput>;
export type EnrollmentMutationInput = z.infer<typeof enrollmentMutationSchema>;
export type EnrollmentStatusInput = z.infer<typeof enrollmentStatusSchema>;
export type EnrollmentDeleteInput = z.infer<typeof enrollmentDeleteSchema>;
export type EnrollmentLevelStatusInput = z.infer<
  typeof enrollmentLevelStatusSchema
>;
