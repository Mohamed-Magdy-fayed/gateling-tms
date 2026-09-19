import { z } from "zod";
import { translationKey } from "@/features/core/i18n/global";
import { idSchema } from "@/lib/id-schema";
import {
  isSlotAligned,
  MINUTES_PER_DAY,
  minutesToTime,
  SLOT_MINUTES,
  timeToMinutes,
  zonedParts,
} from "./week";

/** A time of day, not an end-of-day — "24:00" is not a start time. */
const START_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * What the edit dialog collects. Date and time are separate strings because
 * that is what the two native inputs hand back; `toScheduledAt` joins them
 * in the academy's zone. Shared between the dialog and its tests; the
 * server validates the joined instant with `sessionUpdateSchema`.
 *
 * No `.transform()` or `.default()` — TanStack Form needs input and output
 * types to match (same constraint the group form works under).
 */
export const sessionEditFormSchema = z.object({
  date: z.iso.date(translationKey("groups.validation.date")),
  startTime: z
    .string()
    .regex(START_TIME_PATTERN, translationKey("groups.validation.time"))
    .refine((value) => isSlotAligned(timeToMinutes(value) ?? -1), {
      message: translationKey("sessions.validation.notOnGrid"),
    }),
  durationMinutes: z
    .number()
    .int()
    .min(SLOT_MINUTES, translationKey("sessions.validation.notOnGrid"))
    .max(MINUTES_PER_DAY / 2, translationKey("sessions.validation.tooLong"))
    .refine((value) => value % SLOT_MINUTES === 0, {
      message: translationKey("sessions.validation.notOnGrid"),
    }),
  teacherId: z.union([idSchema, z.literal("")]).nullable(),
});

export type SessionEditFormValues = z.infer<typeof sessionEditFormSchema>;

/** The form's initial values for a session, read on the academy's clock. */
export function sessionEditDefaults(
  session: {
    scheduledAt: Date;
    durationMinutes: number;
    teacherId: string | null;
  },
  timeZone: string,
): SessionEditFormValues {
  const parts = zonedParts(session.scheduledAt, timeZone);
  return {
    date: parts.date,
    startTime: minutesToTime(parts.minutesOfDay),
    durationMinutes: session.durationMinutes,
    teacherId: session.teacherId ?? "",
  };
}
