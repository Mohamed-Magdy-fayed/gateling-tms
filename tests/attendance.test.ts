import { describe, expect, test } from "vitest";
import {
  applyJoin,
  applyLeave,
  matchParticipantToTrainee,
  type RosterCandidate,
} from "../src/features/system/live-classes/attendance/lib/attendance-record";
import { parseZoomSessionEvent } from "../src/features/system/live-classes/attendance/lib/webhook-events";
import { markAttendanceSchema } from "../src/features/system/live-classes/attendance/server/schemas";

const RECEIVED_AT = new Date("2026-08-03T15:30:00.000Z");

describe("parseZoomSessionEvent", () => {
  test("reads a meeting.started payload", () => {
    const event = parseZoomSessionEvent(
      "meeting.started",
      { account_id: "acc", object: { id: 87654321, topic: "Evening B1" } },
      RECEIVED_AT,
    );

    expect(event).toEqual({ kind: "meeting-started", meetingId: "87654321" });
  });

  test("keeps the meeting number as text whether Zoom sends it as one or not", () => {
    const asString = parseZoomSessionEvent(
      "meeting.ended",
      { object: { id: "87654321" } },
      RECEIVED_AT,
    );

    expect(asString).toEqual({ kind: "meeting-ended", meetingId: "87654321" });
  });

  test("reads a participant_joined payload including the join time", () => {
    const event = parseZoomSessionEvent(
      "meeting.participant_joined",
      {
        object: {
          id: 87654321,
          participant: {
            user_name: "Nour Hassan",
            email: "nour@example.com",
            join_time: "2026-08-03T15:02:11Z",
          },
        },
      },
      RECEIVED_AT,
    );

    expect(event).toEqual({
      kind: "participant-joined",
      meetingId: "87654321",
      participant: { email: "nour@example.com", name: "Nour Hassan" },
      joinedAt: new Date("2026-08-03T15:02:11Z"),
    });
  });

  test("treats a guest's empty email as no email at all", () => {
    const event = parseZoomSessionEvent(
      "meeting.participant_left",
      {
        object: {
          id: 87654321,
          participant: {
            user_name: "Nour",
            email: "",
            leave_time: "2026-08-03T16:00:00Z",
          },
        },
      },
      RECEIVED_AT,
    );

    expect(event).toMatchObject({
      kind: "participant-left",
      participant: { email: null, name: "Nour" },
      leftAt: new Date("2026-08-03T16:00:00Z"),
    });
  });

  test("falls back to the delivery time when Zoom omits the stamp", () => {
    const event = parseZoomSessionEvent(
      "meeting.participant_joined",
      { object: { id: 1, participant: { user_name: "Nour" } } },
      RECEIVED_AT,
    );

    expect(event).toMatchObject({ joinedAt: RECEIVED_AT });
  });

  test("reads a recording.completed payload", () => {
    const event = parseZoomSessionEvent(
      "recording.completed",
      {
        object: {
          id: 87654321,
          share_url: "https://zoom.us/rec/share/abc",
          password: "Rec0rd!ng",
        },
      },
      RECEIVED_AT,
    );

    expect(event).toEqual({
      kind: "recording-completed",
      meetingId: "87654321",
      shareUrl: "https://zoom.us/rec/share/abc",
      password: "Rec0rd!ng",
    });
  });

  test("ignores events this app doesn't act on", () => {
    expect(
      parseZoomSessionEvent("meeting.registration_created", {}, RECEIVED_AT),
    ).toBeNull();
  });

  test("ignores a payload Zoom shaped unexpectedly instead of throwing", () => {
    // A retry would never make an unparseable body parse, so it must not fail.
    expect(
      parseZoomSessionEvent("meeting.started", { object: {} }, RECEIVED_AT),
    ).toBeNull();
  });
});

describe("matchParticipantToTrainee", () => {
  const roster: RosterCandidate[] = [
    { traineeId: "t1", email: "nour@example.com", name: "Nour Hassan" },
    { traineeId: "t2", email: null, name: "Omar Fathy" },
    { traineeId: "t3", email: "twins@example.com", name: "Mona Adel" },
    { traineeId: "t4", email: "twins@example.com", name: "Mona Adel" },
  ];

  test("matches on email regardless of case or padding", () => {
    expect(
      matchParticipantToTrainee(
        { email: "  NOUR@Example.com ", name: "Someone else entirely" },
        roster,
      ),
    ).toBe("t1");
  });

  test("falls back to an exact name when the participant has no email", () => {
    expect(
      matchParticipantToTrainee({ email: null, name: "omar  fathy" }, roster),
    ).toBe("t2");
  });

  test("refuses to guess when an address belongs to two trainees", () => {
    expect(
      matchParticipantToTrainee(
        { email: "twins@example.com", name: null },
        roster,
      ),
    ).toBeNull();
  });

  test("refuses to guess when a name belongs to two trainees", () => {
    expect(
      matchParticipantToTrainee({ email: null, name: "Mona Adel" }, roster),
    ).toBeNull();
  });

  test("leaves an unidentifiable participant unrecorded", () => {
    expect(matchParticipantToTrainee({ email: null, name: null }, roster)).toBe(
      null,
    );
    expect(
      matchParticipantToTrainee({ email: null, name: "A Visitor" }, roster),
    ).toBeNull();
  });
});

describe("applyJoin / applyLeave", () => {
  const firstJoin = new Date("2026-08-03T15:00:00Z");
  const firstLeave = new Date("2026-08-03T15:20:00Z");
  const secondJoin = new Date("2026-08-03T15:30:00Z");
  const secondLeave = new Date("2026-08-03T16:00:00Z");

  test("starts a record on the first join", () => {
    expect(applyJoin(null, firstJoin)).toEqual({
      joinedAt: firstJoin,
      leftAt: null,
      attendedMinutes: 0,
    });
  });

  test("counts the minutes between the open join and the leave", () => {
    const afterJoin = applyJoin(null, firstJoin);

    expect(applyLeave(afterJoin, firstLeave).attendedMinutes).toBe(20);
  });

  test("adds up a rejoin rather than replacing the first stretch", () => {
    let times = applyJoin(null, firstJoin);
    times = applyLeave(times, firstLeave);
    times = applyJoin(times, secondJoin);
    times = applyLeave(times, secondLeave);

    expect(times.attendedMinutes).toBe(50);
    expect(times.joinedAt).toEqual(secondJoin);
    expect(times.leftAt).toEqual(secondLeave);
  });

  test("a redelivered leave adds nothing", () => {
    let times = applyJoin(null, firstJoin);
    times = applyLeave(times, firstLeave);
    const replayed = applyLeave(times, firstLeave);

    expect(replayed.attendedMinutes).toBe(20);
  });

  test("an out-of-order join doesn't rewind the current one", () => {
    const times = applyJoin(applyJoin(null, secondJoin), firstJoin);

    expect(times.joinedAt).toEqual(secondJoin);
  });

  test("two leaves with no join between them don't double-count the first stretch", () => {
    let times = applyJoin(null, firstJoin);
    times = applyLeave(times, firstLeave);
    times = applyLeave(times, secondLeave);

    // 15:00–15:20 then 15:20–16:00, not 15:00–15:20 plus 15:00–16:00.
    expect(times.attendedMinutes).toBe(60);
  });

  test("a leave with no join on record still counts as being there", () => {
    expect(applyLeave(null, firstLeave)).toEqual({
      joinedAt: null,
      leftAt: firstLeave,
      attendedMinutes: 0,
    });
  });

  test("never subtracts time when the stamps disagree", () => {
    const times = applyLeave(applyJoin(null, secondJoin), firstLeave);

    expect(times.attendedMinutes).toBe(0);
  });
});

describe("markAttendanceSchema", () => {
  test("accepts a present/absent verdict on a real session and trainee", () => {
    const parsed = markAttendanceSchema.safeParse({
      sessionId: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
      traineeId: "3f2504e0-4f89-11d3-9a0c-0305e82c3302",
      status: "absent",
    });

    expect(parsed.success).toBe(true);
  });

  test("rejects a status outside the two the register records", () => {
    const parsed = markAttendanceSchema.safeParse({
      sessionId: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
      traineeId: "3f2504e0-4f89-11d3-9a0c-0305e82c3302",
      status: "late",
    });

    expect(parsed.success).toBe(false);
  });
});
