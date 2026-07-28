import { describe, expect, test } from "vitest";
import {
  MAX_GENERATED_SESSIONS,
  MAX_SCHEDULE_SLOTS,
} from "@/features/system/learning-flow/groups/server/schedule";
import {
  groupAddStudentsSchema,
  groupMutationSchema,
  groupScheduleSlotSchema,
} from "@/features/system/learning-flow/groups/server/schemas";
import { issueKeyAt } from "./test-utils";

const validSlot = { day: 1, startTime: "18:00", endTime: "20:00" };

const validGroup = {
  name: "Beginners A",
  courseId: null,
  teacherId: null,
  status: "active" as const,
  startDate: "2026-08-03",
  sessionCount: 12,
  schedule: [validSlot],
};

describe("groupScheduleSlotSchema", () => {
  test("accepts a well-formed weekly slot", () => {
    expect(groupScheduleSlotSchema.safeParse(validSlot).success).toBe(true);
  });

  test.each([
    ["Sunday", 0],
    ["Saturday", 6],
  ])("accepts %s as a day index", (_label, day) => {
    expect(
      groupScheduleSlotSchema.safeParse({ ...validSlot, day }).success,
    ).toBe(true);
  });

  test.each([
    ["below range", -1],
    ["above range", 7],
    ["fractional", 1.5],
  ])("rejects a %s day index", (_label, day) => {
    expect(
      groupScheduleSlotSchema.safeParse({ ...validSlot, day }).success,
    ).toBe(false);
  });

  test.each([
    ["not zero-padded", "9:00"],
    ["hour out of range", "24:00"],
    ["minute out of range", "18:60"],
    ["seconds included", "18:00:00"],
    ["empty", ""],
  ])(
    "rejects a startTime that is %s with the time key",
    (_label, startTime) => {
      const result = groupScheduleSlotSchema.safeParse({
        ...validSlot,
        startTime,
      });

      expect(result.success).toBe(false);
      expect(issueKeyAt(result, "startTime")).toBe("groups.validation.time");
    },
  );

  test("rejects an end time before the start, reported on endTime", () => {
    const result = groupScheduleSlotSchema.safeParse({
      ...validSlot,
      startTime: "20:00",
      endTime: "18:00",
    });

    expect(result.success).toBe(false);
    expect(issueKeyAt(result, "endTime")).toBe(
      "groups.validation.slotEndBeforeStart",
    );
  });

  test("rejects a zero-length slot", () => {
    const result = groupScheduleSlotSchema.safeParse({
      ...validSlot,
      startTime: "18:00",
      endTime: "18:00",
    });

    expect(result.success).toBe(false);
    expect(issueKeyAt(result, "endTime")).toBe(
      "groups.validation.slotEndBeforeStart",
    );
  });
});

describe("groupMutationSchema", () => {
  test("accepts a minimal group with no course or teacher", () => {
    const result = groupMutationSchema.safeParse(validGroup);

    expect(result.success).toBe(true);
    // The instant-onboarding promise: a class needs neither.
    expect(result.data?.courseId ?? null).toBeNull();
    expect(result.data?.teacherId ?? null).toBeNull();
  });

  test("accepts a group with no weekly slots yet", () => {
    const result = groupMutationSchema.safeParse({
      ...validGroup,
      schedule: [],
    });

    expect(result.success).toBe(true);
  });

  test("treats the empty string a 'none' select submits as a cleared reference", () => {
    const result = groupMutationSchema.safeParse({
      ...validGroup,
      courseId: "",
      teacherId: "",
    });

    expect(result.success).toBe(true);
  });

  // The schema carries no .default() and no .transform() on purpose: TanStack
  // Form needs a validator whose input and output types match, and either one
  // makes the input optional. Every field is therefore required at the wire.
  test.each(["status", "courseId", "teacherId", "schedule"])(
    "requires %s to be supplied explicitly",
    (field) => {
      const { [field]: _omitted, ...withoutField } = validGroup as Record<
        string,
        unknown
      >;

      expect(groupMutationSchema.safeParse(withoutField).success).toBe(false);
    },
  );

  test("rejects a blank name with the required key", () => {
    const result = groupMutationSchema.safeParse({
      ...validGroup,
      name: "   ",
    });

    expect(result.success).toBe(false);
    expect(issueKeyAt(result, "name")).toBe("forms.validation.required");
  });

  test("rejects an over-long name with the max256 key", () => {
    const result = groupMutationSchema.safeParse({
      ...validGroup,
      name: "a".repeat(257),
    });

    expect(result.success).toBe(false);
    expect(issueKeyAt(result, "name")).toBe("forms.validation.max256");
  });

  test.each([
    ["day-first", "03-08-2026"],
    ["a timestamp", "2026-08-03T00:00:00Z"],
    ["unpadded", "2026-8-3"],
    // Shape-only validation would let these through, and schedule.ts expands
    // an unparseable start date to zero occurrences — so an edit that slipped
    // one past the boundary would silently delete every future scheduled
    // session instead of failing loudly.
    ["a day that doesn't exist in that month", "2024-02-30"],
    ["an out-of-range month", "2026-13-01"],
    ["an out-of-range day", "2026-04-31"],
    ["Feb 29 in a non-leap century", "2100-02-29"],
  ])(
    "rejects a startDate that is %s with the date key",
    (_label, startDate) => {
      const result = groupMutationSchema.safeParse({
        ...validGroup,
        startDate,
      });

      expect(result.success).toBe(false);
      expect(issueKeyAt(result, "startDate")).toBe("groups.validation.date");
    },
  );

  test.each([
    ["a leap day in a leap year", "2024-02-29"],
    ["a leap day in a leap century", "2000-02-29"],
    ["the last day of a 31-day month", "2026-12-31"],
  ])("accepts %s", (_label, startDate) => {
    expect(
      groupMutationSchema.safeParse({ ...validGroup, startDate }).success,
    ).toBe(true);
  });

  test("rejects a sessionCount below one with the min key", () => {
    const result = groupMutationSchema.safeParse({
      ...validGroup,
      sessionCount: 0,
    });

    expect(result.success).toBe(false);
    expect(issueKeyAt(result, "sessionCount")).toBe(
      "groups.validation.sessionCountMin",
    );
  });

  test("rejects a sessionCount above the generator's ceiling", () => {
    const result = groupMutationSchema.safeParse({
      ...validGroup,
      sessionCount: MAX_GENERATED_SESSIONS + 1,
    });

    expect(result.success).toBe(false);
    expect(issueKeyAt(result, "sessionCount")).toBe(
      "groups.validation.sessionCountMax",
    );
  });

  test("accepts a sessionCount exactly at the ceiling", () => {
    expect(
      groupMutationSchema.safeParse({
        ...validGroup,
        sessionCount: MAX_GENERATED_SESSIONS,
      }).success,
    ).toBe(true);
  });

  test("rejects more weekly slots than the generator will expand", () => {
    const result = groupMutationSchema.safeParse({
      ...validGroup,
      schedule: Array.from({ length: MAX_SCHEDULE_SLOTS + 1 }, () => validSlot),
    });

    expect(result.success).toBe(false);
    expect(issueKeyAt(result, "schedule")).toBe(
      "groups.validation.tooManySlots",
    );
  });

  test("rejects a non-uuid courseId", () => {
    expect(
      groupMutationSchema.safeParse({ ...validGroup, courseId: "course-1" })
        .success,
    ).toBe(false);
  });
});

describe("groupAddStudentsSchema", () => {
  const groupId = "11111111-1111-4111-8111-111111111111";
  const traineeId = "22222222-2222-4222-8222-222222222222";

  test("accepts one or more trainee ids", () => {
    expect(
      groupAddStudentsSchema.safeParse({ groupId, traineeIds: [traineeId] })
        .success,
    ).toBe(true);
  });

  test("rejects an empty selection with the required key", () => {
    const result = groupAddStudentsSchema.safeParse({
      groupId,
      traineeIds: [],
    });

    expect(result.success).toBe(false);
    expect(issueKeyAt(result, "traineeIds")).toBe("forms.validation.required");
  });

  test("rejects an oversized batch with the tooManyStudents key", () => {
    const result = groupAddStudentsSchema.safeParse({
      groupId,
      traineeIds: Array.from({ length: 101 }, () => traineeId),
    });

    expect(result.success).toBe(false);
    expect(issueKeyAt(result, "traineeIds")).toBe(
      "groups.validation.tooManyStudents",
    );
  });
});
