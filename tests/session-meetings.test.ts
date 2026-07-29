import { describe, expect, test } from "vitest";
import {
  buildSessionMeetingRequest,
  toZoomStartTime,
} from "../src/features/system/live-classes/sessions/lib/meeting-request";
import {
  selectAvailableZoomClient,
  sessionEndsAt,
} from "../src/features/system/live-classes/sessions/lib/meeting-window";
import {
  canHostSession,
  resolveSessionLinks,
} from "../src/features/system/live-classes/sessions/lib/session-links";
import { listSessionsInput } from "../src/features/system/live-classes/sessions/server/schemas";

const scheduledAt = new Date("2026-08-03T15:00:00.000Z");

describe("zoom meeting request", () => {
  const request = buildSessionMeetingRequest({
    groupName: "Evening B1",
    courseName: "English B1",
    scheduledAt,
    durationMinutes: 90,
    timeZone: "Africa/Cairo",
  });

  test("describes the session as a single scheduled meeting", () => {
    expect(request.type).toBe(2);
    expect(request.topic).toBe("Evening B1");
    expect(request.agenda).toBe("English B1 — Evening B1");
    expect(request.duration).toBe(90);
    expect(request.timezone).toBe("Africa/Cairo");
  });

  test("sends the start time in Zoom's format, without milliseconds", () => {
    expect(request.start_time).toBe("2026-08-03T15:00:00Z");
  });

  test("lets students in before the teacher arrives", () => {
    expect(request.settings.join_before_host).toBe(true);
    expect(request.settings.waiting_room).toBe(false);
  });

  // SOURCE hard-coded `auto_recording: "cloud"`, which an account without
  // cloud recording rejects outright — that must never be why a class fails
  // to get a meeting.
  test("does not force a recording setting on the connected account", () => {
    expect(request.settings).not.toHaveProperty("auto_recording");
  });

  test("falls back to the class name when there is no course", () => {
    const withoutCourse = buildSessionMeetingRequest({
      groupName: "Evening B1",
      courseName: null,
      scheduledAt,
      durationMinutes: 60,
      timeZone: "UTC",
    });

    expect(withoutCourse.agenda).toBe("Evening B1");
  });

  test("truncates a topic Zoom would reject", () => {
    const request = buildSessionMeetingRequest({
      groupName: "x".repeat(500),
      courseName: null,
      scheduledAt,
      durationMinutes: 60,
      timeZone: "UTC",
    });

    expect(request.topic).toHaveLength(200);
  });

  test("keeps the instant, not the wall clock, when formatting", () => {
    expect(toZoomStartTime(new Date("2026-08-03T15:30:45.123Z"))).toBe(
      "2026-08-03T15:30:45Z",
    );
  });
});

describe("zoom client selection", () => {
  test("uses the first connected account when nothing is booked", () => {
    expect(selectAvailableZoomClient(["a", "b"], [])).toBe("a");
  });

  test("skips an account already hosting an overlapping class", () => {
    expect(selectAvailableZoomClient(["a", "b"], ["a"])).toBe("b");
  });

  test("reports no account rather than double-booking one", () => {
    expect(selectAvailableZoomClient(["a", "b"], ["a", "b"])).toBeNull();
  });

  test("has nothing to choose from when the org connected no account", () => {
    expect(selectAvailableZoomClient([], [])).toBeNull();
  });

  test("session end is its start plus its duration", () => {
    expect(sessionEndsAt(scheduledAt, 90).toISOString()).toBe(
      "2026-08-03T16:30:00.000Z",
    );
  });
});

describe("session link visibility", () => {
  const teacherId = "11111111-1111-4111-8111-111111111111";
  const otherUserId = "22222222-2222-4222-8222-222222222222";
  const meeting = {
    teacherId,
    zoomJoinUrl: "https://zoom.us/j/123",
    zoomStartUrl: "https://zoom.us/s/123?zak=secret",
  };

  test("the assigned teacher hosts", () => {
    expect(canHostSession({ userId: teacherId, role: "teacher" }, teacherId)).toBe(
      true,
    );
  });

  test("an admin hosts any session, assigned or not", () => {
    expect(canHostSession({ userId: otherUserId, role: "admin" }, teacherId)).toBe(
      true,
    );
  });

  test("another teacher does not get host rights over someone else's class", () => {
    expect(
      canHostSession({ userId: otherUserId, role: "teacher" }, teacherId),
    ).toBe(false);
  });

  test("a student never hosts", () => {
    expect(canHostSession({ userId: otherUserId, role: "student" }, teacherId)).toBe(
      false,
    );
  });

  test("a teacher with no session assigned to them does not host", () => {
    expect(canHostSession({ userId: otherUserId, role: "teacher" }, null)).toBe(
      false,
    );
  });

  // The host link carries a ZAK token: whoever opens it controls the meeting.
  test("only the host is handed the start url", () => {
    expect(
      resolveSessionLinks({ userId: teacherId, role: "teacher" }, meeting),
    ).toEqual({
      joinUrl: meeting.zoomJoinUrl,
      startUrl: meeting.zoomStartUrl,
    });

    expect(
      resolveSessionLinks({ userId: otherUserId, role: "student" }, meeting),
    ).toEqual({ joinUrl: meeting.zoomJoinUrl, startUrl: null });
  });

  test("an offline session hands out no links at all", () => {
    expect(
      resolveSessionLinks(
        { userId: teacherId, role: "admin" },
        { teacherId, zoomJoinUrl: null, zoomStartUrl: null },
      ),
    ).toEqual({ joinUrl: null, startUrl: null });
  });
});

describe("session list input", () => {
  test("defaults to the upcoming agenda", () => {
    const parsed = listSessionsInput.parse({});
    expect(parsed.scope).toBe("upcoming");
    expect(parsed.page).toBe(1);
  });

  test("rejects a scope the query has no ordering for", () => {
    expect(listSessionsInput.safeParse({ scope: "all" }).success).toBe(false);
  });

  test("rejects a group filter that isn't an id", () => {
    expect(listSessionsInput.safeParse({ groupId: "not-a-uuid" }).success).toBe(
      false,
    );
  });

  test("caps the page size", () => {
    expect(listSessionsInput.safeParse({ perPage: 500 }).success).toBe(false);
  });
});
