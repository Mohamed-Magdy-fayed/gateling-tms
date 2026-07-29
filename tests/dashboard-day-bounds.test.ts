import { describe, expect, test } from "vitest";
import { getDayBoundsInZone } from "@/features/system/dashboard/server/day-bounds";

describe("getDayBoundsInZone", () => {
  test("bounds a plain UTC day", () => {
    const { start, end } = getDayBoundsInZone(
      new Date("2026-03-10T12:00:00Z"),
      "UTC",
    );

    expect(start.toISOString()).toBe("2026-03-10T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-03-11T00:00:00.000Z");
  });

  test("uses the organization's calendar day, not the server's", () => {
    // 22:00Z is already the 11th in Cairo (UTC+2 in winter), so "today" is the
    // 11th — a server reading UTC would show the wrong day's sessions.
    const { start, end } = getDayBoundsInZone(
      new Date("2026-03-10T22:30:00Z"),
      "Africa/Cairo",
    );

    expect(start.toISOString()).toBe("2026-03-10T22:00:00.000Z");
    expect(end.toISOString()).toBe("2026-03-11T22:00:00.000Z");
  });

  test("a spring-forward day is 23 hours long, not 24", () => {
    // New York moves to EDT on 2026-03-08. Adding a fixed 24h to local
    // midnight would spill the first hour of the 9th into the 8th.
    const { start, end } = getDayBoundsInZone(
      new Date("2026-03-08T12:00:00Z"),
      "America/New_York",
    );

    expect(end.getTime() - start.getTime()).toBe(23 * 60 * 60 * 1000);
  });

  test("a fall-back day is 25 hours long", () => {
    const { start, end } = getDayBoundsInZone(
      new Date("2026-11-01T12:00:00Z"),
      "America/New_York",
    );

    expect(end.getTime() - start.getTime()).toBe(25 * 60 * 60 * 1000);
  });

  test("an ordinary day is exactly 24 hours", () => {
    const { start, end } = getDayBoundsInZone(
      new Date("2026-06-15T09:00:00Z"),
      "Africa/Cairo",
    );

    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  test("rolls into the next month at a month boundary", () => {
    const { start, end } = getDayBoundsInZone(
      new Date("2026-01-31T23:00:00Z"),
      "UTC",
    );

    expect(start.toISOString()).toBe("2026-01-31T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-02-01T00:00:00.000Z");
  });
});
