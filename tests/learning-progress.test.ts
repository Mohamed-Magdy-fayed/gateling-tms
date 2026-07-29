import { describe, expect, test } from "vitest";
import {
  summarizeEnrollmentStatuses,
  summarizeLevels,
  summarizeSessions,
} from "@/features/system/learning-flow/progress/server/progress";

describe("summarizeLevels", () => {
  test("returns an all-zero summary for a course with no levels", () => {
    expect(summarizeLevels([])).toEqual({
      total: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      percentComplete: 0,
    });
  });

  test("counts an untouched level as notStarted rather than skipping it", () => {
    const summary = summarizeLevels([
      { status: "completed" },
      { status: null },
      { status: null },
    ]);

    expect(summary.notStarted).toBe(2);
    expect(summary.total).toBe(3);
  });

  test("computes percent complete from completed levels only", () => {
    const summary = summarizeLevels([
      { status: "completed" },
      { status: "inProgress" },
      { status: "notStarted" },
      { status: null },
    ]);

    expect(summary).toEqual({
      total: 4,
      completed: 1,
      inProgress: 1,
      notStarted: 2,
      percentComplete: 25,
    });
  });

  test("rounds the percentage rather than truncating it", () => {
    // 2 of 3 is 66.67 — rounds up to 67, and must not become 66.
    expect(
      summarizeLevels([
        { status: "completed" },
        { status: "completed" },
        { status: null },
      ]).percentComplete,
    ).toBe(67);
  });

  test("reports 100 only when every level is completed", () => {
    expect(
      summarizeLevels([{ status: "completed" }, { status: "completed" }])
        .percentComplete,
    ).toBe(100);
  });
});

describe("summarizeEnrollmentStatuses", () => {
  test("keys every status in the enum even when unused", () => {
    const summary = summarizeEnrollmentStatuses([]);

    expect(summary.total).toBe(0);
    expect(summary.byStatus).toEqual({
      placementTest: 0,
      waiting: 0,
      ongoing: 0,
      completed: 0,
      cancelled: 0,
      postponed: 0,
    });
  });

  test("counts each enrollment under its own status", () => {
    const summary = summarizeEnrollmentStatuses([
      { status: "ongoing" },
      { status: "ongoing" },
      { status: "completed" },
      { status: "cancelled" },
    ]);

    expect(summary.total).toBe(4);
    expect(summary.byStatus.ongoing).toBe(2);
    expect(summary.byStatus.completed).toBe(1);
    expect(summary.byStatus.cancelled).toBe(1);
    expect(summary.byStatus.waiting).toBe(0);
  });
});

describe("summarizeSessions", () => {
  const now = new Date("2026-03-10T12:00:00Z");

  test("returns an all-zero summary for a group with no sessions", () => {
    expect(summarizeSessions([], now)).toEqual({
      total: 0,
      completed: 0,
      cancelled: 0,
      upcoming: 0,
      nextAt: null,
      percentComplete: 0,
      attendance: { recorded: 0, attended: 0, percentAttended: 0 },
    });
  });

  test("excludes cancelled sessions from the completion denominator", () => {
    // 1 completed out of 2 countable (the cancelled one drops out entirely),
    // so 50 — not 33, which is what counting it would give.
    const summary = summarizeSessions(
      [
        { scheduledAt: new Date("2026-03-01T18:00:00Z"), status: "completed" },
        { scheduledAt: new Date("2026-03-03T18:00:00Z"), status: "cancelled" },
        { scheduledAt: new Date("2026-03-12T18:00:00Z"), status: "scheduled" },
      ],
      now,
    );

    expect(summary.cancelled).toBe(1);
    expect(summary.percentComplete).toBe(50);
  });

  test("reports 0 percent when every session was cancelled", () => {
    const summary = summarizeSessions(
      [
        { scheduledAt: new Date("2026-03-01T18:00:00Z"), status: "cancelled" },
        { scheduledAt: new Date("2026-03-03T18:00:00Z"), status: "cancelled" },
      ],
      now,
    );

    expect(summary.percentComplete).toBe(0);
  });

  test("picks the earliest future scheduled session as nextAt", () => {
    const summary = summarizeSessions(
      [
        { scheduledAt: new Date("2026-03-20T18:00:00Z"), status: "scheduled" },
        { scheduledAt: new Date("2026-03-12T18:00:00Z"), status: "scheduled" },
        { scheduledAt: new Date("2026-03-15T18:00:00Z"), status: "scheduled" },
      ],
      now,
    );

    expect(summary.upcoming).toBe(3);
    expect(summary.nextAt).toEqual(new Date("2026-03-12T18:00:00Z"));
  });

  test("ignores past sessions when picking nextAt", () => {
    const summary = summarizeSessions(
      [
        { scheduledAt: new Date("2026-03-01T18:00:00Z"), status: "scheduled" },
        { scheduledAt: new Date("2026-03-14T18:00:00Z"), status: "scheduled" },
      ],
      now,
    );

    expect(summary.upcoming).toBe(1);
    expect(summary.nextAt).toEqual(new Date("2026-03-14T18:00:00Z"));
  });

  test("does not count a cancelled future session as upcoming", () => {
    const summary = summarizeSessions(
      [{ scheduledAt: new Date("2026-03-14T18:00:00Z"), status: "cancelled" }],
      now,
    );

    expect(summary.upcoming).toBe(0);
    expect(summary.nextAt).toBeNull();
  });

  test("treats an ongoing session as neither upcoming nor complete", () => {
    // Mid-class: it has started, so it is not upcoming, but it has not been
    // closed out either — counting it either way would misreport the group.
    const summary = summarizeSessions(
      [
        { scheduledAt: new Date("2026-03-10T11:30:00Z"), status: "ongoing" },
        { scheduledAt: new Date("2026-03-17T18:00:00Z"), status: "scheduled" },
      ],
      now,
    );

    expect(summary.upcoming).toBe(1);
    expect(summary.completed).toBe(0);
    expect(summary.percentComplete).toBe(0);
  });
});
