import { z } from "zod";
import { attendanceStatusValues } from "@/drizzle/schema";
import { MAX_LATE_MINUTES } from "@/features/system/live-classes/attendance/lib/meeting-attendance";
import { idSchema } from "@/lib/id-schema";

export const sessionAttendanceSchema = z.object({
  sessionId: z.uuid(),
});

export const markAttendanceSchema = z.object({
  sessionId: z.uuid(),
  traineeId: idSchema,
  // No "clear it again" value: a register entry that was corrected once is a
  // statement about the class, and unsetting it would leave no trace that
  // anyone had looked.
  status: z.enum(attendanceStatusValues),
  // Only meaningful with `present`; an absence always stores zero. Omitted
  // means "leave what is recorded" — a teacher confirming an automatic
  // presence must not wipe the lateness the meeting measured.
  lateMinutes: z.number().int().min(0).max(MAX_LATE_MINUTES).optional(),
});

export type SessionAttendanceInput = z.infer<typeof sessionAttendanceSchema>;
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
