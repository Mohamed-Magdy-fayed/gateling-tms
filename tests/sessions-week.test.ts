import { describe, expect, test } from "vitest";
import {
  addIsoDays,
  layoutOverlaps,
  MINUTES_PER_DAY,
  minutesToTime,
  roundToSlot,
  snapToSlot,
  timeToMinutes,
  weekBoundsInZone,
  weekDates,
  weekStartOf,
  zonedInstant,
  zonedParts,
} from "@/features/system/live-classes/sessions/lib/week";

const CAIRO = "Africa/Cairo";

describe("week math", () => {
  test("weeks start on Saturday", () => {
    // 2026-09-19 is a Saturday; every day of that week maps back to it.
    for (let offset = 0; offset < 7; offset += 1) {
      expect(weekStartOf(addIsoDays("2026-09-19", offset), CAIRO)).toBe(
        "2026-09-19",
      );
    }
    expect(weekStartOf("2026-09-26", CAIRO)).toBe("2026-09-26");
    expect(weekStartOf("2026-09-18", CAIRO)).toBe("2026-09-12");
  });

  test("a week is seven consecutive local dates", () => {
    expect(weekDates("2026-09-19")).toEqual([
      "2026-09-19",
      "2026-09-20",
      "2026-09-21",
      "2026-09-22",
      "2026-09-23",
      "2026-09-24",
      "2026-09-25",
    ]);
  });

  test("date arithmetic crosses month and year ends", () => {
    expect(addIsoDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addIsoDays("2027-01-02", -3)).toBe("2026-12-30");
    expect(addIsoDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  test("week bounds are local midnights in the academy's zone", () => {
    const bounds = weekBoundsInZone("2026-09-19", CAIRO);
    expect(bounds).not.toBeNull();
    // Cairo is UTC+3 in September (DST), so local midnight is 21:00Z the
    // evening before.
    expect(bounds?.start.toISOString()).toBe("2026-09-18T21:00:00.000Z");
    expect(bounds?.end.toISOString()).toBe("2026-09-25T21:00:00.000Z");
  });

  test("zoned parts and instants round-trip", () => {
    const instant = zonedInstant("2026-09-21", 18 * 60 + 30, CAIRO);
    expect(instant?.toISOString()).toBe("2026-09-21T15:30:00.000Z");

    const parts = zonedParts(instant as Date, CAIRO);
    expect(parts).toEqual({
      date: "2026-09-21",
      dayOfWeek: 1,
      minutesOfDay: 18 * 60 + 30,
    });
  });

  test("a late-evening class stays on its local day for viewers elsewhere", () => {
    // 23:00 Cairo is 20:00Z — still the 21st locally, whatever the server's
    // clock says.
    const instant = zonedInstant("2026-09-21", 23 * 60, CAIRO) as Date;
    expect(zonedParts(instant, CAIRO).date).toBe("2026-09-21");
    expect(zonedParts(instant, "America/New_York").date).toBe("2026-09-21");
    expect(zonedParts(instant, "Asia/Tokyo").date).toBe("2026-09-22");
  });

  test("rejects malformed dates instead of normalising them", () => {
    expect(zonedInstant("2026-02-30", 0, CAIRO)?.toISOString()).not.toBe(
      "2026-02-29T22:00:00.000Z",
    );
    expect(weekBoundsInZone("not-a-date", CAIRO)).toBeNull();
  });
});

describe("times on the 15-minute grid", () => {
  test("parses and prints HH:mm, including the end of the day", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("18:45")).toBe(18 * 60 + 45);
    expect(timeToMinutes("24:00")).toBe(MINUTES_PER_DAY);
    expect(timeToMinutes("24:15")).toBeNull();
    expect(timeToMinutes("9:00")).toBeNull();
    expect(minutesToTime(0)).toBe("00:00");
    expect(minutesToTime(18 * 60 + 45)).toBe("18:45");
    expect(minutesToTime(MINUTES_PER_DAY)).toBe("24:00");
    expect(minutesToTime(MINUTES_PER_DAY + 30)).toBe("24:00");
  });

  test("snaps to the nearest slot without leaving the day", () => {
    expect(snapToSlot(7)).toBe(0);
    expect(snapToSlot(8)).toBe(15);
    expect(snapToSlot(22)).toBe(15);
    expect(snapToSlot(23)).toBe(30);
    expect(snapToSlot(-40)).toBe(0);
    expect(snapToSlot(MINUTES_PER_DAY + 40)).toBe(MINUTES_PER_DAY);
  });
});

describe("overlap layout", () => {
  const bounds = (e: { id: string; start: number; end: number }) => e;

  test("non-overlapping events each get the full width", () => {
    const laid = layoutOverlaps(
      [
        { id: "a", start: 0, end: 60 },
        { id: "b", start: 60, end: 120 },
      ],
      bounds,
    );
    expect(laid.map((l) => [l.event.id, l.lane, l.lanes])).toEqual([
      ["a", 0, 1],
      ["b", 0, 1],
    ]);
  });

  test("overlapping events share the column side by side", () => {
    const laid = layoutOverlaps(
      [
        { id: "a", start: 0, end: 90 },
        { id: "b", start: 30, end: 120 },
        { id: "c", start: 60, end: 150 },
      ],
      bounds,
    );
    expect(laid.map((l) => [l.event.id, l.lane, l.lanes])).toEqual([
      ["a", 0, 3],
      ["b", 1, 3],
      ["c", 2, 3],
    ]);
  });

  test("a freed lane is reused, and clusters don't bleed into each other", () => {
    const laid = layoutOverlaps(
      [
        { id: "a", start: 0, end: 60 },
        { id: "b", start: 30, end: 90 },
        { id: "c", start: 60, end: 120 }, // a has ended: lane 0 again
        { id: "d", start: 200, end: 260 }, // separate cluster
      ],
      bounds,
    );
    expect(laid.map((l) => [l.event.id, l.lane, l.lanes])).toEqual([
      ["a", 0, 2],
      ["b", 1, 2],
      ["c", 0, 2],
      ["d", 0, 1],
    ]);
  });

  test("input order does not change the result", () => {
    const events = [
      { id: "b", start: 30, end: 120 },
      { id: "a", start: 0, end: 90 },
    ];
    expect(layoutOverlaps(events, bounds).map((l) => l.event.id)).toEqual([
      "a",
      "b",
    ]);
  });
});

describe("drag deltas", () => {
  test("round to the grid in both directions", () => {
    expect(roundToSlot(-40)).toBe(-45);
    expect(roundToSlot(-7)).toBe(0);
    expect(roundToSlot(8)).toBe(15);
    expect(roundToSlot(-8)).toBe(-15);
  });
});
