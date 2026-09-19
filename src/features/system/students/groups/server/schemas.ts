import { z } from "zod";
import { groupStatusValues } from "@/drizzle/schema";
import { translationKey } from "@/features/core/i18n/global";
import {
  MAX_IMPORT_BASE64_LENGTH,
  MAX_IMPORT_ROWS,
} from "@/features/core/import/lib";
import { idSchema } from "@/lib/id-schema";
import { MAX_GENERATED_SESSIONS, MAX_SCHEDULE_SLOTS } from "./schedule";

export const listGroupsInput = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).default([]),
  globalFilter: z.string().optional(),
});

/** Zero-padded 24h "HH:mm" — the same shape schedule.ts expands. */
const timeOfDay = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):([0-5]\d)$/,
    translationKey("groups.validation.time"),
  );

export const groupScheduleSlotSchema = z
  .object({
    // 0 = Sunday … 6 = Saturday, matching JS Date#getDay().
    day: z.number().int().min(0).max(6),
    startTime: timeOfDay,
    endTime: timeOfDay,
  })
  .refine((slot) => slot.endTime > slot.startTime, {
    // Safe as a string comparison: both sides are zero-padded "HH:mm".
    message: translationKey("groups.validation.slotEndBeforeStart"),
    path: ["endTime"],
  });

/**
 * An optional reference: a real id, or the empty string a "none" select option
 * submits, or null. Normalized to null by the mutation, the same way trainees'
 * optional phone/email are.
 *
 * Deliberately no `.transform()` and no `.default()` anywhere in this schema:
 * TanStack Form requires a validator whose input and output types match its
 * form values exactly, and either one makes the input type optional. Keeping
 * the schema plain lets the client and the server share it instead of
 * maintaining a near-duplicate form-only copy.
 */
const optionalReference = z.union([idSchema, z.literal("")]).nullable();

export const groupMutationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(256, translationKey("forms.validation.max256")),
  courseId: optionalReference,
  teacherId: optionalReference,
  status: z.enum(groupStatusValues),
  // z.iso.date rather than a /^\d{4}-\d{2}-\d{2}$/ regex: the regex accepts
  // impossible calendar dates like 2026-02-30, which schedule.ts rejects and
  // expands to zero occurrences — so an edit that slipped one through would
  // silently wipe every future scheduled session. z.iso.date checks real
  // calendar validity, including non-leap centuries (2100-02-29 is rejected).
  startDate: z.iso.date(translationKey("groups.validation.date")),
  sessionCount: z
    .number()
    .int()
    .min(1, translationKey("groups.validation.sessionCountMin"))
    .max(
      MAX_GENERATED_SESSIONS,
      translationKey("groups.validation.sessionCountMax"),
    ),
  schedule: z
    .array(groupScheduleSlotSchema)
    .max(MAX_SCHEDULE_SLOTS, translationKey("groups.validation.tooManySlots")),
});

export const groupUpdateSchema = groupMutationSchema.extend({
  id: z.uuid(),
});

export const groupDeleteSchema = z.object({
  id: z.uuid(),
});

export const groupAddStudentsSchema = z.object({
  groupId: z.uuid(),
  traineeIds: z
    .array(idSchema)
    .min(1, translationKey("forms.validation.required"))
    .max(100, translationKey("groups.validation.tooManyStudents")),
});

export const groupRemoveStudentSchema = z.object({
  groupId: z.uuid(),
  traineeId: idSchema,
});

/**
 * One row of an uploaded group-assignments template. No `id` column — a roster
 * entry has no identity worth carrying in a spreadsheet.
 */
export const groupStudentImportRowSchema = z.object({
  groupName: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(256, translationKey("forms.validation.max256")),
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
});

export const groupStudentImportPreviewInput = z.object({
  fileName: z.string().min(1).max(256),
  base64: z.string().min(1).max(MAX_IMPORT_BASE64_LENGTH),
});

export const groupStudentImportCommitInput = z.object({
  rows: z.array(z.record(z.string(), z.string())).min(1).max(MAX_IMPORT_ROWS),
});

/**
 * Whether a save managed to generate the group's sessions. Lives here rather
 * than beside the mutation that produces it because the form dialog reads it
 * too, and this is the one module in the feature both sides already import.
 *
 * Only `failed` means the group has a schedule and no sessions, and only that
 * warrants telling the user anything. There is no longer a "queued" case: the
 * generation runs inline and is authoritative, because a queued one can be
 * accepted and then never consumed (D178) without anything saying so.
 */
export type SessionRegenerationMode = "generated" | "failed";

export type ListGroupsInput = z.infer<typeof listGroupsInput>;
export type GroupStudentImportRow = z.infer<typeof groupStudentImportRowSchema>;
export type GroupStudentImportPreviewInput = z.infer<
  typeof groupStudentImportPreviewInput
>;
export type GroupStudentImportCommitInput = z.infer<
  typeof groupStudentImportCommitInput
>;
export type GroupMutationInput = z.infer<typeof groupMutationSchema>;
export type GroupUpdateInput = z.infer<typeof groupUpdateSchema>;
export type GroupDeleteInput = z.infer<typeof groupDeleteSchema>;
export type GroupAddStudentsInput = z.infer<typeof groupAddStudentsSchema>;
export type GroupRemoveStudentInput = z.infer<typeof groupRemoveStudentSchema>;
