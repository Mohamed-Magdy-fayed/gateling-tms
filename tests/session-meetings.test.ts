import { describe, expect, test } from "vitest";
import {
  buildSessionsUrl,
  parseSessionJoinResultCode,
} from "../src/features/system/live-classes/sessions/lib/join-result";
import {
  buildMeetingTitle,
  buildSessionExternalRef,
  parseSessionExternalRef,
  resolveMeetingHostUserId,
  sessionMeetingIdempotencyKey,
} from "../src/features/system/live-classes/sessions/lib/meeting-ref";
import {
  isWithinMeetingWindow,
  MEETING_EARLY_START_MINUTES,
  MEETING_LATE_START_MINUTES,
  sessionEndsAt,
} from "../src/features/system/live-classes/sessions/lib/meeting-window";
import {
  canHostSession,
  isMeetingHost,
  sessionJoinPath,
} from "../src/features/system/live-classes/sessions/lib/session-links";
import { listSessionsInput } from "../src/features/system/live-classes/sessions/server/schemas";

const scheduledAt = new Date("2026-08-03T15:00:00.000Z");
const durationMinutes = 90;
const sessionId = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

describe("meeting window", () => {
  test("session end is its start plus its duration", () => {
    expect(sessionEndsAt(scheduledAt, durationMinutes).toISOString()).toBe(
      "2026-08-03T16:30:00.000Z",
    );
  });

  test("a class can be started at its scheduled time", () => {
    expect(
      isWithinMeetingWindow(scheduledAt, durationMinutes, scheduledAt),
    ).toBe(true);
  });

  test("a teacher who arrives early can still open the room", () => {
    const early = new Date(
      scheduledAt.getTime() - (MEETING_EARLY_START_MINUTES - 1) * 60_000,
    );

    expect(isWithinMeetingWindow(scheduledAt, durationMinutes, early)).toBe(
      true,
    );
  });

  test("a class three weeks away cannot be started today", () => {
    const longBefore = new Date(scheduledAt.getTime() - 21 * 86_400_000);

    expect(
      isWithinMeetingWindow(scheduledAt, durationMinutes, longBefore),
    ).toBe(false);
  });

  test("a teacher running late can still start it", () => {
    const late = new Date(
      sessionEndsAt(scheduledAt, durationMinutes).getTime() +
        (MEETING_LATE_START_MINUTES - 1) * 60_000,
    );

    expect(isWithinMeetingWindow(scheduledAt, durationMinutes, late)).toBe(
      true,
    );
  });

  test("last week's class can no longer be started", () => {
    const longAfter = new Date(scheduledAt.getTime() + 7 * 86_400_000);

    expect(isWithinMeetingWindow(scheduledAt, durationMinutes, longAfter)).toBe(
      false,
    );
  });
});

/**
 * The handle a session and its Gateling Meetings room share. The webhook that
 * closes a class only has this to go on, so it has to survive a round trip
 * and reject anything that isn't ours.
 */
describe("session ↔ meeting reference", () => {
  test("the external ref round-trips the session id", () => {
    expect(parseSessionExternalRef(buildSessionExternalRef(sessionId))).toBe(
      sessionId,
    );
  });

  test("a ref that isn't a session's is ignored, not parsed", () => {
    expect(parseSessionExternalRef("booking:8812")).toBeNull();
    expect(parseSessionExternalRef(null)).toBeNull();
    expect(parseSessionExternalRef(undefined)).toBeNull();
  });

  test("a session ref that doesn't carry a uuid is ignored too", () => {
    expect(parseSessionExternalRef("session:")).toBeNull();
    expect(parseSessionExternalRef("session:../etc")).toBeNull();
  });

  test("the idempotency key is stable per session", () => {
    expect(sessionMeetingIdempotencyKey(sessionId)).toBe(
      sessionMeetingIdempotencyKey(sessionId),
    );
    expect(sessionMeetingIdempotencyKey(sessionId)).toContain(sessionId);
  });

  test("the meeting title reads as group + date, and stays bounded", () => {
    expect(buildMeetingTitle("Beginner Batch A", scheduledAt)).toBe(
      "Beginner Batch A — 2026-08-03",
    );
    expect(
      buildMeetingTitle("x".repeat(500), scheduledAt).length,
    ).toBeLessThanOrEqual(200);
  });

  test("the assigned teacher hosts, even when an admin starts the class", () => {
    expect(resolveMeetingHostUserId("teacher-id", "admin-id")).toBe(
      "teacher-id",
    );
  });

  test("an unassigned class is hosted by whoever starts it", () => {
    expect(resolveMeetingHostUserId(null, "admin-id")).toBe("admin-id");
  });
});

/**
 * The join route may only ever put one of these codes in the URL it redirects
 * back to — never text (STATE.md D47).
 */
describe("join result codes", () => {
  test("a known code round-trips through the agenda URL", () => {
    const url = buildSessionsUrl("notStarted");
    const code = new URL(url, "https://tms.example").searchParams.get(
      "joinResult",
    );

    expect(parseSessionJoinResultCode(code)).toBe("notStarted");
  });

  test("anything else is dropped rather than rendered", () => {
    expect(parseSessionJoinResultCode("<script>")).toBeNull();
    expect(parseSessionJoinResultCode("")).toBeNull();
    expect(parseSessionJoinResultCode(null)).toBeNull();
  });
});

describe("who may start a class", () => {
  const teacherId = "11111111-1111-4111-8111-111111111111";
  const otherUserId = "22222222-2222-4222-8222-222222222222";

  test("the assigned teacher may", () => {
    expect(
      canHostSession({ userId: teacherId, role: "teacher" }, teacherId),
    ).toBe(true);
  });

  test("an admin may start any session, assigned or not", () => {
    expect(
      canHostSession({ userId: otherUserId, role: "admin" }, teacherId),
    ).toBe(true);
  });

  test("another teacher may not start someone else's class", () => {
    expect(
      canHostSession({ userId: otherUserId, role: "teacher" }, teacherId),
    ).toBe(false);
  });

  test("a student never may", () => {
    expect(
      canHostSession({ userId: otherUserId, role: "student" }, teacherId),
    ).toBe(false);
  });

  test("a teacher with no session assigned to them may not", () => {
    expect(canHostSession({ userId: otherUserId, role: "teacher" }, null)).toBe(
      false,
    );
  });
});

/**
 * Host rights on the room itself belong to one account — the one recorded
 * when the class was started — and Meetings refuses a host link to anyone
 * else. Distinct from who may *start*: an admin can start a teacher's class
 * and still join it as a participant.
 */
describe("who holds the room's host rights", () => {
  const teacherId = "11111111-1111-4111-8111-111111111111";
  const adminId = "22222222-2222-4222-8222-222222222222";

  test("the recorded host is the host", () => {
    expect(isMeetingHost({ userId: teacherId }, teacherId)).toBe(true);
  });

  test("an admin who didn't start it is not", () => {
    expect(isMeetingHost({ userId: adminId }, teacherId)).toBe(false);
  });

  test("a class with no meeting has no host yet", () => {
    expect(isMeetingHost({ userId: teacherId }, null)).toBe(false);
  });

  test("the join path is the in-app route, never the meeting's own url", () => {
    expect(sessionJoinPath(sessionId)).toBe(
      `/live-classes/sessions/${sessionId}/join`,
    );
  });
});

describe("listSessionsInput", () => {
  test("defaults to the upcoming agenda", () => {
    expect(listSessionsInput.parse({}).scope).toBe("upcoming");
  });

  test("defaults to the first page at a bounded size", () => {
    const parsed = listSessionsInput.parse({});

    expect(parsed.page).toBe(1);
    expect(parsed.perPage).toBe(20);
  });

  test("rejects a scope it has no order for", () => {
    expect(listSessionsInput.safeParse({ scope: "sideways" }).success).toBe(
      false,
    );
  });

  test("refuses an unbounded page size", () => {
    expect(listSessionsInput.safeParse({ perPage: 5000 }).success).toBe(false);
  });

  test("refuses a groupId that isn't a uuid", () => {
    expect(listSessionsInput.safeParse({ groupId: "not-a-uuid" }).success).toBe(
      false,
    );
  });

  test("accepts a real groupId filter", () => {
    expect(
      listSessionsInput.safeParse({
        groupId: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
      }).success,
    ).toBe(true);
  });
});
