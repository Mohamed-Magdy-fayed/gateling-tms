import { describe, expect, test } from "vitest";
import { markAttendanceSchema } from "../src/features/system/live-classes/attendance/server/schemas";

/**
 * Attendance is teacher-marked only (STATE.md D144). onMeeting exposes no
 * webhooks and no participants endpoint, so the Zoom-era event parsing,
 * participant matching, and join/leave folding this file used to cover no
 * longer exist — the register is what a human says it is.
 */
describe("markAttendanceSchema", () => {
  test("accepts a present/absent verdict on a real session and trainee", () => {
    const parsed = markAttendanceSchema.safeParse({
      sessionId: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
      traineeId: "3f2504e0-4f89-11d3-9a0c-0305e82c3302",
      status: "absent",
    });

    expect(parsed.success).toBe(true);
  });

  test("rejects a status outside the two the register records", () => {
    const parsed = markAttendanceSchema.safeParse({
      sessionId: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
      traineeId: "3f2504e0-4f89-11d3-9a0c-0305e82c3302",
      status: "late",
    });

    expect(parsed.success).toBe(false);
  });

  test("rejects an id that isn't a uuid", () => {
    const parsed = markAttendanceSchema.safeParse({
      sessionId: "not-a-uuid",
      traineeId: "3f2504e0-4f89-11d3-9a0c-0305e82c3302",
      status: "present",
    });

    expect(parsed.success).toBe(false);
  });
});
