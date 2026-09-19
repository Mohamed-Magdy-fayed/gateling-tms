import { describe, expect, test } from "vitest";
import {
  addAvailabilityWindow,
  isWithinAvailability,
  normalizeAvailability,
  removeAvailabilitySlot,
} from "@/features/system/live-classes/availability/lib/slots";
import { canSetAvailability } from "@/features/system/live-classes/availability/server/mutations";
import {
  availabilitySlotSchema,
  setTeacherAvailabilitySchema,
} from "@/features/system/live-classes/availability/server/schemas";

const TEACHER = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";

describe("availability windows", () => {
  test("sorts by day then start", () => {
    expect(
      normalizeAvailability([
        { day: 3, startTime: "09:00", endTime: "10:00" },
        { day: 1, startTime: "18:00", endTime: "20:00" },
        { day: 1, startTime: "08:00", endTime: "09:00" },
      ]),
    ).toEqual([
      { day: 1, startTime: "08:00", endTime: "09:00" },
      { day: 1, startTime: "18:00", endTime: "20:00" },
      { day: 3, startTime: "09:00", endTime: "10:00" },
    ]);
  });

  test("merges overlapping and touching windows on the same day only", () => {
    expect(
      normalizeAvailability([
        { day: 1, startTime: "16:00", endTime: "19:00" },
        { day: 1, startTime: "18:00", endTime: "22:00" },
        { day: 1, startTime: "22:00", endTime: "23:00" },
        { day: 2, startTime: "16:00", endTime: "19:00" },
      ]),
    ).toEqual([
      { day: 1, startTime: "16:00", endTime: "23:00" },
      { day: 2, startTime: "16:00", endTime: "19:00" },
    ]);
  });

  test("snaps outward to the 15-minute grid and drops junk", () => {
    expect(
      normalizeAvailability([
        { day: 1, startTime: "16:07", endTime: "18:52" },
        { day: 9, startTime: "10:00", endTime: "11:00" },
        { day: 1, startTime: "12:00", endTime: "11:00" },
        { day: 1, startTime: "nope", endTime: "11:00" },
      ]),
    ).toEqual([{ day: 1, startTime: "16:00", endTime: "19:00" }]);
  });

  test("a window may run to midnight", () => {
    expect(
      normalizeAvailability([{ day: 5, startTime: "20:00", endTime: "24:00" }]),
    ).toEqual([{ day: 5, startTime: "20:00", endTime: "24:00" }]);
  });

  test("painting adds and merges; removing takes exactly one window", () => {
    const base = [{ day: 1, startTime: "16:00", endTime: "18:00" }];
    const painted = addAvailabilityWindow(base, {
      day: 1,
      start: 17 * 60,
      end: 20 * 60,
    });
    expect(painted).toEqual([{ day: 1, startTime: "16:00", endTime: "20:00" }]);

    const withTuesday = addAvailabilityWindow(painted, {
      day: 2,
      start: 9 * 60,
      end: 10 * 60,
    });
    expect(
      removeAvailabilitySlot(withTuesday, {
        day: 1,
        startTime: "16:00",
        endTime: "20:00",
      }),
    ).toEqual([{ day: 2, startTime: "09:00", endTime: "10:00" }]);
  });

  test("a class fits only when one window contains all of it", () => {
    const slots = [
      { day: 1, startTime: "16:00", endTime: "18:00" },
      { day: 1, startTime: "19:00", endTime: "21:00" },
    ];
    expect(isWithinAvailability(slots, { day: 1, start: 960, end: 1080 })).toBe(
      true,
    );
    // Spans the gap between two windows.
    expect(
      isWithinAvailability(slots, { day: 1, start: 1020, end: 1200 }),
    ).toBe(false);
    expect(isWithinAvailability(slots, { day: 2, start: 960, end: 1080 })).toBe(
      false,
    );
  });
});

describe("availability schema", () => {
  test("accepts grid-aligned windows, including one ending at 24:00", () => {
    expect(
      availabilitySlotSchema.safeParse({
        day: 6,
        startTime: "09:15",
        endTime: "24:00",
      }).success,
    ).toBe(true);
  });

  test("rejects off-grid times and inverted windows", () => {
    expect(
      availabilitySlotSchema.safeParse({
        day: 1,
        startTime: "09:10",
        endTime: "10:00",
      }).success,
    ).toBe(false);
    expect(
      availabilitySlotSchema.safeParse({
        day: 1,
        startTime: "11:00",
        endTime: "10:00",
      }).success,
    ).toBe(false);
    expect(
      availabilitySlotSchema.safeParse({
        day: 7,
        startTime: "09:00",
        endTime: "10:00",
      }).success,
    ).toBe(false);
  });

  test("caps the number of windows per teacher", () => {
    const slots = Array.from({ length: 43 }, (_, index) => ({
      day: index % 7,
      startTime: "09:00",
      endTime: "10:00",
    }));
    expect(
      setTeacherAvailabilitySchema.safeParse({ teacherId: TEACHER, slots })
        .success,
    ).toBe(false);
    expect(
      setTeacherAvailabilitySchema.safeParse({
        teacherId: TEACHER,
        slots: slots.slice(0, 42),
      }).success,
    ).toBe(true);
  });
});

describe("who may set availability", () => {
  test("admins set anyone's, teachers only their own, students nobody's", () => {
    expect(canSetAvailability({ userId: OTHER, role: "admin" }, TEACHER)).toBe(
      true,
    );
    expect(
      canSetAvailability({ userId: TEACHER, role: "teacher" }, TEACHER),
    ).toBe(true);
    expect(
      canSetAvailability({ userId: OTHER, role: "teacher" }, TEACHER),
    ).toBe(false);
    expect(
      canSetAvailability({ userId: TEACHER, role: "student" }, TEACHER),
    ).toBe(false);
  });
});
