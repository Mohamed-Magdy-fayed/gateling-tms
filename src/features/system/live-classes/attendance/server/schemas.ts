import { z } from "zod";
import { attendanceStatusValues } from "@/drizzle/schema";

export const sessionAttendanceSchema = z.object({
  sessionId: z.uuid(),
});

export const markAttendanceSchema = z.object({
  sessionId: z.uuid(),
  traineeId: z.uuid(),
  // No "clear it again" value: a register entry that was corrected once is a
  // statement about the class, and unsetting it would leave no trace that
  // anyone had looked.
  status: z.enum(attendanceStatusValues),
});

export type SessionAttendanceInput = z.infer<typeof sessionAttendanceSchema>;
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
