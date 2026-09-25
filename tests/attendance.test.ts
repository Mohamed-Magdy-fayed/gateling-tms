import { describe, expect, test } from "vitest";
import {
  computeLateMinutes,
  matchParticipantToTrainee,
  normalizePersonName,
  summarizeConnections,
} from "../src/features/system/live-classes/attendance/lib/meeting-attendance";
import { markAttendanceSchema } from "../src/features/system/live-classes/attendance/server/schemas";

const SESSION_ID = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";
const TRAINEE_ID = "3f2504e0-4f89-11d3-9a0c-0305e82c3302";

describe("markAttendanceSchema", () => {
  test("accepts a present/absent verdict on a real session and trainee", () => {
    const parsed = markAttendanceSchema.safeParse({
      sessionId: SESSION_ID,
      traineeId: TRAINEE_ID,
      status: "absent",
    });

    expect(parsed.success).toBe(true);
  });

  test("rejects a status outside the two the register records", () => {
    const parsed = markAttendanceSchema.safeParse({
      sessionId: SESSION_ID,
      traineeId: TRAINEE_ID,
      status: "late",
    });

    expect(parsed.success).toBe(false);
  });

  test("rejects an id that isn't a uuid", () => {
    const parsed = markAttendanceSchema.safeParse({
      sessionId: "not-a-uuid",
      traineeId: TRAINEE_ID,
      status: "present",
    });

    expect(parsed.success).toBe(false);
  });

  test("accepts minutes late on a presence", () => {
    const parsed = markAttendanceSchema.safeParse({
      sessionId: SESSION_ID,
      traineeId: TRAINEE_ID,
      status: "present",
      lateMinutes: 12,
    });

    expect(parsed.success).toBe(true);
  });

  test("rejects negative, fractional, or absurd lateness", () => {
    for (const lateMinutes of [-1, 2.5, 100_000]) {
      const parsed = markAttendanceSchema.safeParse({
        sessionId: SESSION_ID,
        traineeId: TRAINEE_ID,
        status: "present",
        lateMinutes,
      });
      expect(parsed.success).toBe(false);
    }
  });
});

describe("normalizePersonName", () => {
  test("ignores case, spacing and punctuation", () => {
    expect(normalizePersonName("  Omar   EL-Sayed ")).toBe("omar el sayed");
  });

  test("folds the Arabic letter variants people type interchangeably", () => {
    expect(normalizePersonName("أحمد")).toBe(normalizePersonName("احمد"));
    expect(normalizePersonName("إسراء")).toBe(normalizePersonName("اسراء"));
    expect(normalizePersonName("فاطمة")).toBe(normalizePersonName("فاطمه"));
    expect(normalizePersonName("مصطفى")).toBe(normalizePersonName("مصطفي"));
  });

  test("drops harakat and tatweel", () => {
    expect(normalizePersonName("مُحَمَّد")).toBe(normalizePersonName("محمد"));
    expect(normalizePersonName("محـــمد")).toBe(normalizePersonName("محمد"));
  });
});

describe("matchParticipantToTrainee", () => {
  const roster = [
    { traineeId: "a", names: ["Omar Khaled", null] },
    { traineeId: "b", names: ["سارة علي", "Sara Ali"] },
    { traineeId: "c", names: ["Mona Adel"] },
    { traineeId: "d", names: ["mona adel"] },
  ];

  test("matches a trainee by their name", () => {
    expect(matchParticipantToTrainee("omar khaled", roster)).toBe("a");
  });

  test("matches by the linked account's name too", () => {
    expect(matchParticipantToTrainee("Sara Ali", roster)).toBe("b");
    expect(matchParticipantToTrainee("ساره على", roster)).toBe("b");
  });

  test("does not guess from a partial name", () => {
    expect(matchParticipantToTrainee("Omar", roster)).toBeNull();
  });

  test("matches nobody when two trainees share the name", () => {
    expect(matchParticipantToTrainee("Mona Adel", roster)).toBeNull();
  });

  test("matches nobody for an empty name", () => {
    expect(matchParticipantToTrainee(" - ", roster)).toBeNull();
  });
});

describe("computeLateMinutes", () => {
  const scheduledAt = new Date("2026-09-25T10:00:00Z");

  test("early or within the first minute is on time", () => {
    expect(
      computeLateMinutes(scheduledAt, new Date("2026-09-25T09:55:00Z")),
    ).toBe(0);
    expect(
      computeLateMinutes(scheduledAt, new Date("2026-09-25T10:00:59Z")),
    ).toBe(0);
  });

  test("counts whole minutes after the start", () => {
    expect(
      computeLateMinutes(scheduledAt, new Date("2026-09-25T10:12:40Z")),
    ).toBe(12);
  });
});

describe("summarizeConnections", () => {
  const at = (time: string) => new Date(`2026-09-25T${time}:00Z`);
  const endedAt = at("11:00");

  test("sums separate connections", () => {
    expect(
      summarizeConnections(
        [
          { joinedAt: at("10:05"), leftAt: at("10:20") },
          { joinedAt: at("10:30"), leftAt: at("10:50") },
        ],
        endedAt,
      ),
    ).toEqual({
      joinedAt: at("10:05"),
      leftAt: at("10:50"),
      attendedMinutes: 35,
    });
  });

  test("does not double-count overlapping tabs", () => {
    expect(
      summarizeConnections(
        [
          { joinedAt: at("10:00"), leftAt: at("10:40") },
          { joinedAt: at("10:10"), leftAt: at("10:30") },
        ],
        endedAt,
      )?.attendedMinutes,
    ).toBe(40);
  });

  test("closes a still-open connection at the end of the class", () => {
    expect(
      summarizeConnections([{ joinedAt: at("10:15"), leftAt: null }], endedAt),
    ).toEqual({ joinedAt: at("10:15"), leftAt: endedAt, attendedMinutes: 45 });
  });

  test("nothing to summarize without a connection", () => {
    expect(summarizeConnections([], endedAt)).toBeNull();
  });
});
