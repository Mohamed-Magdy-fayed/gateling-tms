import { z } from "zod";
import { translationKey } from "@/features/core/i18n/global";
import { idSchema } from "@/lib/id-schema";

export const listCertificatesInput = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).default([]),
  globalFilter: z.string().optional(),
  // Set by the trainee detail page's certificates section; omitted by the
  // cross-trainee table.
  traineeId: idSchema.optional(),
});

/**
 * Deliberately no `.default()` and no `.transform()` — TanStack Form needs a
 * validator whose input and output types match its form values exactly, and
 * either one makes the input type optional (STATE.md D82). Empty-string
 * references are normalized to `null` in the mutation instead, the same way
 * groups' and trainees' optional fields already work.
 */
export const certificateMutationSchema = z.object({
  traineeId: z.uuid(translationKey("forms.validation.required")),
  title: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(256, translationKey("forms.validation.max256")),
  // Both optional: a certificate can commemorate finishing a course, finishing
  // a group's classes, or both. A group needs no course at all (STATE.md
  // D77(3)), so requiring either one here would contradict the schema.
  courseId: z.uuid().nullable().or(z.literal("")),
  groupId: z.uuid().nullable().or(z.literal("")),
});

export const certificateDeleteSchema = z.object({
  id: z.uuid(),
});

export type ListCertificatesInput = z.infer<typeof listCertificatesInput>;
export type CertificateMutationInput = z.infer<
  typeof certificateMutationSchema
>;
export type CertificateDeleteInput = z.infer<typeof certificateDeleteSchema>;
