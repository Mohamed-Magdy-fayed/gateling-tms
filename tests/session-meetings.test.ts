import { describe, expect, test } from "vitest";
import {
  isWithinMeetingWindow,
  MEETING_EARLY_START_MINUTES,
  MEETING_LATE_START_MINUTES,
  selectAvailableMeetingAccount,
  sessionEndsAt,
} from "../src/features/system/live-classes/sessions/lib/meeting-window";
import {
  canHostSession,
  resolveSessionLinks,
} from "../src/features/system/live-classes/sessions/lib/session-links";
import { listSessionsInput } from "../src/features/system/live-classes/sessions/server/schemas";

const scheduledAt = new Date("2026-08-03T15:00:00.000Z");
const durationMinutes = 90;

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

  test("a class three weeks away cannot claim a room today", () => {
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
 * A room hosts one live meeting at a time — the legacy client surfaced the
 * collision as "Another meeting may be ongoing now on this zoom room!", so
 * picking a busy one is a real failure, not a cosmetic one (STATE.md D143).
 */
describe("meeting room selection", () => {
  test("uses the first connected room when nothing is booked", () => {
    expect(selectAvailableMeetingAccount(["a", "b"], [])).toBe("a");
  });

  test("skips a room already hosting an overlapping class", () => {
    expect(selectAvailableMeetingAccount(["a", "b"], ["a"])).toBe("b");
  });

  test("reports no room rather than double-booking one", () => {
    expect(selectAvailableMeetingAccount(["a", "b"], ["a", "b"])).toBeNull();
  });

  test("has nothing to choose from when the org connected no room", () => {
    expect(selectAvailableMeetingAccount([], [])).toBeNull();
  });
});

describe("session link visibility", () => {
  const teacherId = "11111111-1111-4111-8111-111111111111";
  const otherUserId = "22222222-2222-4222-8222-222222222222";
  const meeting = {
    teacherId,
    joinUrl: "https://onmeeting.co/j/123",
    startUrl: "https://onmeeting.co/s/123?zak=secret",
  };

  test("the assigned teacher hosts", () => {
    expect(
      canHostSession({ userId: teacherId, role: "teacher" }, teacherId),
    ).toBe(true);
  });

  test("an admin hosts any session, assigned or not", () => {
    expect(
      canHostSession({ userId: otherUserId, role: "admin" }, teacherId),
    ).toBe(true);
  });

  test("another teacher does not get host rights over someone else's class", () => {
    expect(
      canHostSession({ userId: otherUserId, role: "teacher" }, teacherId),
    ).toBe(false);
  });

  test("a student never hosts", () => {
    expect(
      canHostSession({ userId: otherUserId, role: "student" }, teacherId),
    ).toBe(false);
  });

  test("a teacher with no session assigned to them does not host", () => {
    expect(canHostSession({ userId: otherUserId, role: "teacher" }, null)).toBe(
      false,
    );
  });

  // The host link grants control of the meeting to whoever opens it.
  test("only the host is handed the start url", () => {
    expect(
      resolveSessionLinks({ userId: teacherId, role: "teacher" }, meeting),
    ).toEqual({
      joinUrl: meeting.joinUrl,
      startUrl: meeting.startUrl,
    });

    expect(
      resolveSessionLinks({ userId: otherUserId, role: "student" }, meeting),
    ).toEqual({ joinUrl: meeting.joinUrl, startUrl: null });
  });

  test("a class nobody has started yet hands out no links at all", () => {
    expect(
      resolveSessionLinks(
        { userId: teacherId, role: "admin" },
        { teacherId, joinUrl: null, startUrl: null },
      ),
    ).toEqual({ joinUrl: null, startUrl: null });
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
