import { describe, expect, test } from "vitest";
import {
  generateSessionOccurrences,
  MAX_GENERATED_SESSIONS,
} from "@/features/system/learning-flow/groups/server/schedule";

const CAIRO = "Africa/Cairo";

// 2026-08-03 is a Monday; 2026-01-05 is a Monday.
const mondaySlot = { day: 1, startTime: "18:00", endTime: "20:00" };
const wednesdaySlot = { day: 3, startTime: "10:00", endTime: "11:30" };

function isoTimes(
  occurrences: ReturnType<typeof generateSessionOccurrences>,
): string[] {
  return occurrences.map((o) => o.scheduledAt.toISOString());
}

describe("generateSessionOccurrences", () => {
  test("emits the requested number of weekly occurrences starting on startDate", () => {
    const occurrences = generateSessionOccurrences({
      schedule: [mondaySlot],
      startDate: "2026-08-03",
      sessionCount: 3,
      timeZone: "UTC",
    });

    expect(isoTimes(occurrences)).toEqual([
      "2026-08-03T18:00:00.000Z",
      "2026-08-10T18:00:00.000Z",
      "2026-08-17T18:00:00.000Z",
    ]);
  });

  test("derives durationMinutes from the slot's start and end times", () => {
    const [first] = generateSessionOccurrences({
      schedule: [wednesdaySlot],
      startDate: "2026-08-03",
      sessionCount: 1,
      timeZone: "UTC",
    });

    expect(first.durationMinutes).toBe(90);
  });

  test("skips forward to the first matching weekday when startDate isn't one", () => {
    // 2026-08-04 is a Tuesday — the first Monday slot is the 10th.
    const occurrences = generateSessionOccurrences({
      schedule: [mondaySlot],
      startDate: "2026-08-04",
      sessionCount: 1,
      timeZone: "UTC",
    });

    expect(isoTimes(occurrences)).toEqual(["2026-08-10T18:00:00.000Z"]);
  });

  test("interleaves multiple weekly slots in chronological order", () => {
    const occurrences = generateSessionOccurrences({
      schedule: [wednesdaySlot, mondaySlot],
      startDate: "2026-08-03",
      sessionCount: 4,
      timeZone: "UTC",
    });

    expect(isoTimes(occurrences)).toEqual([
      "2026-08-03T18:00:00.000Z",
      "2026-08-05T10:00:00.000Z",
      "2026-08-10T18:00:00.000Z",
      "2026-08-12T10:00:00.000Z",
    ]);
  });

  test("honours sessionCount exactly, even mid-week", () => {
    const occurrences = generateSessionOccurrences({
      schedule: [mondaySlot, wednesdaySlot],
      startDate: "2026-08-03",
      sessionCount: 3,
      timeZone: "UTC",
    });

    expect(occurrences).toHaveLength(3);
    expect(isoTimes(occurrences).at(-1)).toBe("2026-08-10T18:00:00.000Z");
  });

  test("interprets slot times as wall-clock in the given time zone", () => {
    // Cairo is UTC+3 in August (EEST): 18:00 local is 15:00Z.
    const occurrences = generateSessionOccurrences({
      schedule: [mondaySlot],
      startDate: "2026-08-03",
      sessionCount: 1,
      timeZone: CAIRO,
    });

    expect(isoTimes(occurrences)).toEqual(["2026-08-03T15:00:00.000Z"]);
  });

  test("keeps wall-clock time stable across a DST transition", () => {
    // Egypt's DST ends in late October: the same 18:00 class is 15:00Z while
    // EEST is in effect and 16:00Z once the clocks go back. The wall-clock
    // time the academy publishes must not drift.
    const occurrences = generateSessionOccurrences({
      schedule: [mondaySlot],
      startDate: "2026-10-19",
      sessionCount: 3,
      timeZone: CAIRO,
    });

    const offsets = occurrences.map((o) =>
      new Intl.DateTimeFormat("en-GB", {
        timeZone: CAIRO,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(o.scheduledAt),
    );

    expect(offsets).toEqual(["18:00", "18:00", "18:00"]);
    // ...while the underlying instants genuinely differ by an hour.
    expect(new Set(isoTimes(occurrences)).size).toBe(3);
    expect(isoTimes(occurrences)[0]).toBe("2026-10-19T15:00:00.000Z");
    expect(isoTimes(occurrences).at(-1)).toBe("2026-11-02T16:00:00.000Z");
  });

  test("resolves weekday against the target zone, not the host clock", () => {
    // 2026-08-03 18:00 in Kiritimati (UTC+14) is still Monday locally even
    // though the resulting instant is Sunday in UTC.
    const occurrences = generateSessionOccurrences({
      schedule: [mondaySlot],
      startDate: "2026-08-03",
      sessionCount: 1,
      timeZone: "Pacific/Kiritimati",
    });

    expect(isoTimes(occurrences)).toEqual(["2026-08-03T04:00:00.000Z"]);
    expect(occurrences[0].scheduledAt.getUTCDay()).toBe(1);
  });

  describe("invalid input", () => {
    test("returns nothing for an empty schedule", () => {
      expect(
        generateSessionOccurrences({
          schedule: [],
          startDate: "2026-08-03",
          sessionCount: 5,
          timeZone: "UTC",
        }),
      ).toEqual([]);
    });

    test.each([
      ["non-integer sessionCount", 2.5],
      ["zero sessionCount", 0],
      ["negative sessionCount", -3],
    ])("returns nothing for %s", (_label, sessionCount) => {
      expect(
        generateSessionOccurrences({
          schedule: [mondaySlot],
          startDate: "2026-08-03",
          sessionCount,
          timeZone: "UTC",
        }),
      ).toEqual([]);
    });

    test.each([
      ["malformed", "03-08-2026"],
      ["a date that doesn't exist", "2026-02-30"],
      ["an out-of-range month", "2026-13-01"],
    ])("returns nothing when startDate is %s", (_label, startDate) => {
      expect(
        generateSessionOccurrences({
          schedule: [mondaySlot],
          startDate,
          sessionCount: 2,
          timeZone: "UTC",
        }),
      ).toEqual([]);
    });

    test("skips malformed slots but still generates the valid ones", () => {
      const occurrences = generateSessionOccurrences({
        schedule: [
          { day: 9, startTime: "18:00", endTime: "20:00" }, // day out of range
          { day: 1, startTime: "6:00", endTime: "20:00" }, // not zero-padded
          { day: 1, startTime: "24:00", endTime: "25:00" }, // hour out of range
          { day: 1, startTime: "20:00", endTime: "18:00" }, // ends before it starts
          { day: 1, startTime: "18:00", endTime: "18:00" }, // zero length
          mondaySlot,
        ],
        startDate: "2026-08-03",
        sessionCount: 2,
        timeZone: "UTC",
      });

      expect(isoTimes(occurrences)).toEqual([
        "2026-08-03T18:00:00.000Z",
        "2026-08-10T18:00:00.000Z",
      ]);
    });

    test("never exceeds MAX_GENERATED_SESSIONS however high sessionCount goes", () => {
      const occurrences = generateSessionOccurrences({
        schedule: [mondaySlot, wednesdaySlot],
        startDate: "2026-08-03",
        sessionCount: 10_000,
        timeZone: "UTC",
      });

      expect(occurrences).toHaveLength(MAX_GENERATED_SESSIONS);
    });

    test("deduplicates slots that resolve to the same instant", () => {
      const occurrences = generateSessionOccurrences({
        schedule: [mondaySlot, { ...mondaySlot, endTime: "19:00" }],
        startDate: "2026-08-03",
        sessionCount: 2,
        timeZone: "UTC",
      });

      expect(isoTimes(occurrences)).toEqual([
        "2026-08-03T18:00:00.000Z",
        "2026-08-10T18:00:00.000Z",
      ]);
    });
  });
});
