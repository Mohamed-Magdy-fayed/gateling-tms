import { z } from "zod";
import { groupStatusValues } from "@/drizzle/schema";
import { translationKey } from "@/features/core/i18n/global";
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

export const groupMutationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(256, translationKey("forms.validation.max256")),
  courseId: z.uuid().nullish(),
  teacherId: z.uuid().nullish(),
  status: z.enum(groupStatusValues).default("active"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, translationKey("groups.validation.date")),
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
    .max(MAX_SCHEDULE_SLOTS, translationKey("groups.validation.tooManySlots"))
    .default([]),
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
    .array(z.uuid())
    .min(1, translationKey("forms.validation.required"))
    .max(100, translationKey("groups.validation.tooManyStudents")),
});

export const groupRemoveStudentSchema = z.object({
  groupId: z.uuid(),
  traineeId: z.uuid(),
});

export type ListGroupsInput = z.infer<typeof listGroupsInput>;
export type GroupMutationInput = z.infer<typeof groupMutationSchema>;
export type GroupUpdateInput = z.infer<typeof groupUpdateSchema>;
export type GroupDeleteInput = z.infer<typeof groupDeleteSchema>;
export type GroupAddStudentsInput = z.infer<typeof groupAddStudentsSchema>;
export type GroupRemoveStudentInput = z.infer<typeof groupRemoveStudentSchema>;
