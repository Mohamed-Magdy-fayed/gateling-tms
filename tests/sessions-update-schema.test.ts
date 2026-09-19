import { describe, expect, test } from "vitest";
import {
  sessionEditDefaults,
  sessionEditFormSchema,
} from "@/features/system/live-classes/sessions/lib/session-edit-form";
import { isSessionEditable } from "@/features/system/live-classes/sessions/lib/session-editing";
import {
  sessionUpdateSchema,
  weekSessionsInput,
} from "@/features/system/live-classes/sessions/server/schemas";

const SESSION = "11111111-1111-1111-1111-111111111111";
const TEACHER = "22222222-2222-2222-2222-222222222222";

describe("sessions.update input", () => {
  const valid = {
    id: SESSION,
    scheduledAt: new Date("2026-09-21T15:30:00.000Z"),
    durationMinutes: 90,
    teacherId: TEACHER,
  };

  test("accepts a grid-aligned move", () => {
    expect(sessionUpdateSchema.safeParse(valid).success).toBe(true);
    expect(
      sessionUpdateSchema.safeParse({ ...valid, teacherId: "" }).success,
    ).toBe(true);
    expect(
      sessionUpdateSchema.safeParse({ ...valid, teacherId: null }).success,
    ).toBe(true);
  });

  test("rejects an instant off the 15-minute grid", () => {
    expect(
      sessionUpdateSchema.safeParse({
        ...valid,
        scheduledAt: new Date("2026-09-21T15:20:00.000Z"),
      }).success,
    ).toBe(false);
    expect(
      sessionUpdateSchema.safeParse({
        ...valid,
        scheduledAt: new Date("2026-09-21T15:30:05.000Z"),
      }).success,
    ).toBe(false);
  });

  test("rejects durations that are off-grid, too short, or absurd", () => {
    for (const durationMinutes of [0, 10, 100, 725]) {
      expect(
        sessionUpdateSchema.safeParse({ ...valid, durationMinutes }).success,
      ).toBe(false);
    }
    expect(
      sessionUpdateSchema.safeParse({ ...valid, durationMinutes: 720 }).success,
    ).toBe(true);
  });
});

describe("sessions.week input", () => {
  test("wants a real calendar date", () => {
    expect(
      weekSessionsInput.safeParse({ weekStart: "2026-09-19" }).success,
    ).toBe(true);
    expect(
      weekSessionsInput.safeParse({ weekStart: "2026-02-30" }).success,
    ).toBe(false);
    expect(
      weekSessionsInput.safeParse({ weekStart: "19/09/2026" }).success,
    ).toBe(false);
  });
});

describe("edit dialog form", () => {
  test("reads a session's defaults on the academy's clock", () => {
    expect(
      sessionEditDefaults(
        {
          scheduledAt: new Date("2026-09-21T15:30:00.000Z"),
          durationMinutes: 90,
          teacherId: null,
        },
        "Africa/Cairo",
      ),
    ).toEqual({
      date: "2026-09-21",
      startTime: "18:30",
      durationMinutes: 90,
      teacherId: "",
    });
  });

  test("holds the form to the same grid the server enforces", () => {
    const base = {
      date: "2026-09-21",
      startTime: "18:30",
      durationMinutes: 90,
      teacherId: "",
    };
    expect(sessionEditFormSchema.safeParse(base).success).toBe(true);
    expect(
      sessionEditFormSchema.safeParse({ ...base, startTime: "18:20" }).success,
    ).toBe(false);
    // "24:00" is an end of day, never a start.
    expect(
      sessionEditFormSchema.safeParse({ ...base, startTime: "24:00" }).success,
    ).toBe(false);
    expect(
      sessionEditFormSchema.safeParse({ ...base, durationMinutes: 50 }).success,
    ).toBe(false);
  });
});

describe("which classes can be moved", () => {
  test("only ones that have not started", () => {
    expect(isSessionEditable("scheduled")).toBe(true);
    expect(isSessionEditable("ongoing")).toBe(false);
    expect(isSessionEditable("completed")).toBe(false);
    expect(isSessionEditable("cancelled")).toBe(false);
  });
});
