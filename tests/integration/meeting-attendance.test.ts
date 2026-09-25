import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { db } from "@/drizzle";
import {
  GroupStudentsTable,
  GroupsTable,
  SessionStudentsTable,
  SessionsTable,
  TraineesTable,
} from "@/drizzle/schema";
import {
  findSessionForMeeting,
  type MeetingSession,
  reconcileMeetingAttendance,
  recordMeetingJoin,
} from "@/features/system/live-classes/attendance/server/meeting-sync";
import { createTenant, destroyTenant, type TenantFixture } from "./lib/harness";
import { seedTenantData } from "./lib/tenant-fixtures";

/**
 * The register writes Gateling Meetings' webhooks make, against a real
 * database — the upserts carry hand-written SQL (`least`, `case`, `excluded`)
 * that only Postgres can check.
 */

const MEETING_CODE = "abc-defg-hij";
const at = (time: string) => new Date(`2026-09-01T${time}:00Z`);

let org: TenantFixture;
let session: MeetingSession;
const trainees: Record<"omar" | "sara" | "mona", string> = {
  omar: "",
  sara: "",
  mona: "",
};

async function recordOf(traineeId: string) {
  const [row] = await db
    .select()
    .from(SessionStudentsTable)
    .where(
      and(
        eq(SessionStudentsTable.sessionId, session.id),
        eq(SessionStudentsTable.traineeId, traineeId),
      ),
    );
  return row;
}

beforeAll(async () => {
  org = await createTenant("MEETA", "Meeting Attendance Org");
  const data = await seedTenantData(org);

  const [group] = await db
    .insert(GroupsTable)
    .values({
      organizationId: org.organizationId,
      name: "Meeting Group",
      courseId: data.courseId,
      schedule: [{ day: 2, startTime: "18:00", endTime: "19:00" }],
    })
    .returning({ id: GroupsTable.id });

  for (const [key, name] of [
    ["omar", "Omar Khaled"],
    ["sara", "سارة علي"],
    ["mona", "Mona Adel"],
  ] as const) {
    const [trainee] = await db
      .insert(TraineesTable)
      .values({
        organizationId: org.organizationId,
        name,
        createdBy: org.userId,
      })
      .returning({ id: TraineesTable.id });
    trainees[key] = trainee.id;
    await db.insert(GroupStudentsTable).values({
      organizationId: org.organizationId,
      groupId: group.id,
      traineeId: trainee.id,
    });
  }

  const [row] = await db
    .insert(SessionsTable)
    .values({
      organizationId: org.organizationId,
      groupId: group.id,
      scheduledAt: at("18:00"),
      durationMinutes: 60,
      status: "ongoing",
      meetingCode: MEETING_CODE,
    })
    .returning({ id: SessionsTable.id });

  const found = await findSessionForMeeting(db, row.id, MEETING_CODE);
  if (!found) throw new Error("fixture session not found");
  session = found;
});

afterAll(async () => {
  if (org) await destroyTenant(org);
});

describe("meeting attendance sync", () => {
  test("a session is found only under the meeting it points at", async () => {
    expect(await findSessionForMeeting(db, session.id, "zzz-zzzz-zzz")).toBe(
      null,
    );
  });

  test("a join marks the trainee present, with minutes late", async () => {
    await recordMeetingJoin(db, session, trainees.omar, at("18:12"));

    expect(await recordOf(trainees.omar)).toMatchObject({
      status: "present",
      source: "meetings",
      joinedAt: at("18:12"),
      lateMinutes: 12,
    });
  });

  test("an earlier rejoin keeps the first arrival; a later one changes nothing", async () => {
    await recordMeetingJoin(db, session, trainees.omar, at("18:40"));
    expect(await recordOf(trainees.omar)).toMatchObject({
      joinedAt: at("18:12"),
      lateMinutes: 12,
    });

    // A webhook delivered out of order: the earlier join wins.
    await recordMeetingJoin(db, session, trainees.omar, at("18:03"));
    expect(await recordOf(trainees.omar)).toMatchObject({
      joinedAt: at("18:03"),
      lateMinutes: 3,
    });
  });

  test("a join never overrides a teacher's verdict", async () => {
    await db.insert(SessionStudentsTable).values({
      organizationId: org.organizationId,
      sessionId: session.id,
      traineeId: trainees.mona,
      status: "absent",
      source: "manual",
      markedBy: org.userId,
    });

    await recordMeetingJoin(db, session, trainees.mona, at("18:30"));

    expect(await recordOf(trainees.mona)).toMatchObject({
      status: "absent",
      source: "manual",
      joinedAt: null,
      lateMinutes: 0,
    });
  });

  test("the room closing settles timings by name, and keeps manual verdicts", async () => {
    const matched = await reconcileMeetingAttendance(
      db,
      session,
      [
        // The teacher — never a register entry.
        {
          displayName: "Omar Khaled",
          role: "host",
          joinedAt: at("17:55"),
          leftAt: null,
        },
        {
          displayName: "omar  khaled",
          role: "participant",
          joinedAt: at("18:03"),
          leftAt: at("18:20"),
        },
        {
          displayName: "Omar Khaled",
          role: "participant",
          joinedAt: at("18:30"),
          leftAt: null,
        },
        // A join whose webhook was lost, spelled differently.
        {
          displayName: "ساره على",
          role: "participant",
          joinedAt: at("18:05"),
          leftAt: at("18:50"),
        },
        {
          displayName: "Mona Adel",
          role: "participant",
          joinedAt: at("18:10"),
          leftAt: at("18:40"),
        },
        // Nobody on the roster.
        {
          displayName: "Guest 42",
          role: "participant",
          joinedAt: at("18:00"),
          leftAt: at("19:00"),
        },
      ],
      at("19:00"),
    );

    expect(matched).toBe(3);
    expect(await recordOf(trainees.omar)).toMatchObject({
      status: "present",
      source: "meetings",
      joinedAt: at("18:03"),
      leftAt: at("19:00"),
      attendedMinutes: 47,
      lateMinutes: 3,
    });
    expect(await recordOf(trainees.sara)).toMatchObject({
      status: "present",
      source: "meetings",
      attendedMinutes: 45,
      lateMinutes: 5,
    });
    // Timings fill in; the teacher's verdict and lateness stay.
    expect(await recordOf(trainees.mona)).toMatchObject({
      status: "absent",
      source: "manual",
      joinedAt: at("18:10"),
      attendedMinutes: 30,
      lateMinutes: 0,
    });
  });
});
