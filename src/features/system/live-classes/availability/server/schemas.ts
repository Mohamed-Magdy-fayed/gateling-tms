import { z } from "zod";
import { translationKey } from "@/features/core/i18n/global";
import {
  isSlotAligned,
  TIME_OF_DAY_PATTERN,
  timeToMinutes,
} from "@/features/system/live-classes/sessions/lib/week";
import { idSchema } from "@/lib/id-schema";
import { MAX_AVAILABILITY_SLOTS } from "../lib/slots";

/** "HH:mm" on the 15-minute grid; "24:00" allowed so a window can run to midnight. */
const gridTime = z
  .string()
  .regex(TIME_OF_DAY_PATTERN, translationKey("groups.validation.time"))
  .refine((value) => isSlotAligned(timeToMinutes(value) ?? -1), {
    message: translationKey("sessions.validation.notOnGrid"),
  });

export const availabilitySlotSchema = z
  .object({
    // 0 = Sunday … 6 = Saturday, matching JS Date#getDay() and group slots.
    day: z.number().int().min(0).max(6),
    startTime: gridTime,
    endTime: gridTime,
  })
  .refine(
    (slot) =>
      (timeToMinutes(slot.endTime) ?? 0) > (timeToMinutes(slot.startTime) ?? 0),
    {
      message: translationKey("groups.validation.slotEndBeforeStart"),
      path: ["endTime"],
    },
  );

export const listTeacherAvailabilityInput = z.object({
  teacherId: idSchema.optional(),
});

/**
 * Replaces a teacher's whole weekly pattern. Set-shaped rather than
 * add/remove endpoints because that is what the calendar holds: it paints a
 * window, merges it into what it already shows, and sends the result — one
 * round trip, and no way for two quick edits to leave a half-applied state.
 */
export const setTeacherAvailabilitySchema = z.object({
  teacherId: idSchema,
  slots: z
    .array(availabilitySlotSchema)
    .max(
      MAX_AVAILABILITY_SLOTS,
      translationKey("sessions.availability.validation.tooManySlots"),
    ),
});

export type ListTeacherAvailabilityInput = z.infer<
  typeof listTeacherAvailabilityInput
>;
export type SetTeacherAvailabilityInput = z.infer<
  typeof setTeacherAvailabilitySchema
>;
