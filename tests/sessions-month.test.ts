import { describe, expect, test } from "vitest";
import { groupByDay } from "@/features/system/live-classes/sessions/lib/day-groups";
import { viewAnchorParams } from "@/features/system/live-classes/sessions/lib/view-anchor";
import {
  addIsoDays,
  addIsoMonths,
  countInMonth,
  findTeacherOverlaps,
  type MonthSessionLike,
  monthBoundsInZone,
  monthGridDates,
  monthStartOf,
  parseMonthParam,
  zonedInstant,
} from "@/features/system/live-classes/sessions/lib/week";

const CAIRO = "Africa/Cairo";
const SANTIAGO = "America/Santiago";

function session(
  id: string,
  scheduledAt: string,
  values: Partial<MonthSessionLike> = {},
): MonthSessionLike {
  return {
    id,
    scheduledAt: new Date(scheduledAt),
    durationMinutes: 60,
    status: "scheduled",
    teacherId: "t1",
    ...values,
  };
}

describe("month math", () => {
  test("month start and month arithmetic", () => {
    expect(monthStartOf("2026-09-17")).toBe("2026-09-01");
    expect(monthStartOf("2026-09-30")).toBe("2026-09-01");
    expect(addIsoMonths("2026-12-01", 1)).toBe("2027-01-01");
    expect(addIsoMonths("2027-01-01", -1)).toBe("2026-12-01");
    expect(addIsoMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addIsoMonths("2028-01-31", 1)).toBe("2028-02-29");
  });

  test("the grid is 4, 5 or 6 whole Saturday-first weeks", () => {
    // February 2025 starts on a Saturday and has 28 days: exactly 4 rows.
    const february = monthGridDates("2025-02-01", CAIRO);
    expect(february.length / 7).toBe(4);
    expect(february[0]).toBe("2025-02-01");
    // August 2026 starts on a Saturday and has 31 days: 5 rows.
    expect(monthGridDates("2026-08-01", CAIRO).length / 7).toBe(5);
    // May 2026 starts on a Friday and has 31 days: 6 rows.
    const may = monthGridDates("2026-05-01", CAIRO);
    expect(may.length / 7).toBe(6);
    expect(may[0]).toBe("2026-04-25");
    expect(may.at(-1)).toBe("2026-06-05");
  });

  test("grid dates are unique and consecutive, leap February included", () => {
    for (const month of ["2028-02-01", "2026-09-01", "2026-12-01"]) {
      const dates = monthGridDates(month, CAIRO);
      expect(new Set(dates).size).toBe(dates.length);
      dates.slice(1).forEach((date, index) => {
        expect(date).toBe(addIsoDays(dates[index], 1));
      });
    }
  });

  test("bounds are local midnights of the grid edges, across DST", () => {
    const cairo = monthBoundsInZone("2026-09-01", CAIRO);
    expect(cairo?.gridStart).toBe("2026-08-29");
    expect(cairo?.gridEnd).toBe("2026-10-03");
    expect(cairo?.start.toISOString()).toBe("2026-08-28T21:00:00.000Z");
    expect(cairo?.end.toISOString()).toBe("2026-10-02T21:00:00.000Z");

    // Santiago springs forward at midnight in early September, so this
    // five-week grid is one hour short of 35 × 24 hours.
    const santiago = monthBoundsInZone("2026-09-01", SANTIAGO);
    expect(santiago?.start).toEqual(zonedInstant("2026-08-29", 0, SANTIAGO));
    expect(santiago?.end).toEqual(zonedInstant("2026-10-03", 0, SANTIAGO));
    const hours =
      ((santiago?.end.getTime() ?? 0) - (santiago?.start.getTime() ?? 0)) /
      3_600_000;
    expect(hours).toBe(35 * 24 - 1);

    expect(monthBoundsInZone("not-a-date", CAIRO)).toBeNull();
  });

  test("month params accept real dates only", () => {
    expect(parseMonthParam("2026-09-17")).toBe("2026-09-01");
    expect(parseMonthParam("abc")).toBeNull();
    expect(parseMonthParam("2026-13-01")).toBeNull();
    expect(parseMonthParam("2026-02-30")).toBeNull();
    expect(parseMonthParam("")).toBeNull();
    expect(parseMonthParam(null)).toBeNull();
  });
});

describe("month counts and clashes", () => {
  test("counts in-month, non-cancelled classes on the academy's clock", () => {
    const rows = [
      session("a", "2026-09-01T18:00:00Z"),
      session("b", "2026-09-02T18:00:00Z", { status: "cancelled" }),
      session("c", "2026-08-30T18:00:00Z"), // neighbour-month day in the grid
      // 22:30Z on the 30th is 01:30 on October 1st in Cairo.
      session("d", "2026-09-30T22:30:00Z"),
    ];
    expect(countInMonth(rows, "2026-09-01", CAIRO)).toBe(1);
  });

  test("finds a teacher booked twice, and nothing else", () => {
    const { sessionIds, byDate } = findTeacherOverlaps(
      [
        session("a", "2026-09-01T13:00:00Z"),
        session("b", "2026-09-01T13:30:00Z"),
        // Starts exactly when b ends: back-to-back, not a clash.
        session("c", "2026-09-01T14:30:00Z"),
        session("d", "2026-09-01T13:00:00Z", { status: "cancelled" }),
        session("e", "2026-09-01T13:00:00Z", { teacherId: null }),
        session("f", "2026-09-01T13:00:00Z", { teacherId: "t2" }),
      ],
      CAIRO,
    );
    expect([...sessionIds].sort()).toEqual(["a", "b"]);
    expect(byDate.get("2026-09-01")?.sort()).toEqual(["a", "b"]);
  });

  test("a class running past local midnight clashes with the next day's", () => {
    // 23:00 Cairo on the 1st for two hours, and 00:30 Cairo on the 2nd.
    const { byDate } = findTeacherOverlaps(
      [
        session("late", "2026-09-01T20:00:00Z", { durationMinutes: 120 }),
        session("early", "2026-09-01T21:30:00Z"),
      ],
      CAIRO,
    );
    expect(byDate.get("2026-09-02")?.sort()).toEqual(["early", "late"]);
    expect(byDate.has("2026-09-01")).toBe(false);
  });
});

describe("day groups", () => {
  test("a late-evening class lands on its local day", () => {
    // 20:30Z is 23:30 in Cairo, still the 21st.
    const days = groupByDay(
      [
        { id: "a", scheduledAt: new Date("2026-09-21T20:30:00Z") },
        { id: "b", scheduledAt: new Date("2026-09-21T21:30:00Z") },
      ],
      "en",
      CAIRO,
    );
    expect(days.map((day) => [day.date, day.sessions.length])).toEqual([
      ["2026-09-21", 1],
      ["2026-09-22", 1],
    ]);
  });
});

describe("view switching keeps your place", () => {
  const params = (values: Record<string, string>) =>
    new URLSearchParams(values);

  test("week → month uses the month owning most of the week", () => {
    // Sep 26 – Oct 2 is five September days and two October ones.
    const next = viewAnchorParams(
      "week",
      "month",
      params({ view: "week", week: "2026-09-26" }),
      "2026-11-10",
      CAIRO,
    );
    expect(next.get("month")).toBe("2026-09-01");
    expect(next.has("week")).toBe(false);

    const lateAugust = viewAnchorParams(
      "week",
      "month",
      params({ week: "2026-08-29" }),
      "2026-11-10",
      CAIRO,
    );
    expect(lateAugust.get("month")).toBe("2026-09-01");
  });

  test("week → month prefers today's month when today is in the week", () => {
    const next = viewAnchorParams(
      "week",
      "month",
      params({ week: "2026-08-29" }),
      "2026-08-30",
      CAIRO,
    );
    expect(next.get("month")).toBe("2026-08-01");
  });

  test("month → week opens today's week in this month, else the 1st's", () => {
    const thisMonth = viewAnchorParams(
      "month",
      "week",
      params({ month: "2026-09-01" }),
      "2026-09-24",
      CAIRO,
    );
    expect(thisMonth.get("week")).toBe("2026-09-19");
    expect(thisMonth.has("month")).toBe(false);

    const otherMonth = viewAnchorParams(
      "month",
      "week",
      params({ month: "2026-10-01" }),
      "2026-09-24",
      CAIRO,
    );
    expect(otherMonth.get("week")).toBe("2026-09-26");
  });

  test("no anchor means now, and the list keeps both params", () => {
    const now = viewAnchorParams(
      "week",
      "month",
      params({ month: "2026-01-01" }),
      "2026-09-24",
      CAIRO,
    );
    expect(now.has("month")).toBe(false);

    const kept = viewAnchorParams(
      "week",
      "list",
      params({ week: "2026-09-19", teacher: "x" }),
      "2026-09-24",
      CAIRO,
    );
    expect(kept.get("week")).toBe("2026-09-19");
    expect(kept.get("teacher")).toBe("x");
  });
});
