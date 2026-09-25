import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { db } from "@/drizzle";
import {
  GroupStudentsTable,
  GroupsTable,
  SessionsTable,
  TraineesTable,
} from "@/drizzle/schema";
import {
  createMember,
  createTenant,
  destroyMember,
  destroyTenant,
  type TenantFixture,
} from "./lib/harness";
import { seedTenantData, type TenantData } from "./lib/tenant-fixtures";

/**
 * What a `student` sees on the calendar, against a real database.
 *
 * The org-isolation suite proves one academy can't see another's classes.
 * This one covers the rule *inside* an academy: a student's week and month
 * hold only the classes of groups their own trainee record is on
 * (`ownClassesOnlyForStudents`), and a student with no trainee record sees
 * nothing rather than an error.
 */

let org: TenantFixture;
let data: TenantData;
let otherSessionId: string;
let student: Awaited<ReturnType<typeof createMember>>;
let strayStudent: Awaited<ReturnType<typeof createMember>>;

beforeAll(async () => {
  org = await createTenant("VISA", "Visibility Org");
  data = await seedTenantData(org);

  // A second group in the same academy, with a class inside the pinned week
  // and month, that the student is NOT on.
  const [otherGroup] = await db
    .insert(GroupsTable)
    .values({
      organizationId: org.organizationId,
      name: "Other Group",
      courseId: data.courseId,
      schedule: [{ day: 3, startTime: "18:00", endTime: "19:00" }],
    })
    .returning({ id: GroupsTable.id });
  const [otherSession] = await db
    .insert(SessionsTable)
    .values({
      organizationId: org.organizationId,
      groupId: otherGroup.id,
      scheduledAt: new Date("2026-09-02T18:00:00Z"),
      durationMinutes: 60,
    })
    .returning({ id: SessionsTable.id });
  otherSessionId = otherSession.id;

  // The student's account, bridged to a trainee record on the fixture group.
  student = await createMember(org, "student");
  const [trainee] = await db
    .insert(TraineesTable)
    .values({
      organizationId: org.organizationId,
      userId: student.userId,
      name: "Visible Student",
      email: `student-${student.userId}@integration.test`,
      createdBy: org.userId,
    })
    .returning({ id: TraineesTable.id });
  await db.insert(GroupStudentsTable).values({
    organizationId: org.organizationId,
    groupId: data.groupId,
    traineeId: trainee.id,
  });

  // A student member with no trainee record at all.
  strayStudent = await createMember(org, "student");
});

afterAll(async () => {
  if (student) await destroyMember(student.userId);
  if (strayStudent) await destroyMember(strayStudent.userId);
  if (org) await destroyTenant(org);
});

describe("calendar visibility inside an academy", () => {
  test("staff see both groups' classes (control)", async () => {
    const month = await org.caller.sessions.month({ month: "2026-09-01" });
    const ids = month.rows.map((row) => row.id);
    expect(ids).toContain(data.sessionId);
    expect(ids).toContain(otherSessionId);
  });

  test("a student's month and week hold only their own group's classes", async () => {
    const month = await student.caller.sessions.month({ month: "2026-09-01" });
    expect(month.rows.map((row) => row.id)).toEqual([data.sessionId]);

    const week = await student.caller.sessions.week({
      weekStart: "2026-08-29",
    });
    expect(week.rows.map((row) => row.id)).toEqual([data.sessionId]);
  });

  test("a student with no trainee record gets an empty month, not an error", async () => {
    const month = await strayStudent.caller.sessions.month({
      month: "2026-09-01",
    });
    expect(month.rows).toEqual([]);
  });

  test("month defaults to the current month on the academy's clock", async () => {
    const month = await org.caller.sessions.month({});
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: month.timeZone,
      year: "numeric",
      month: "2-digit",
    }).format(new Date());
    expect(month.monthStart).toBe(`${today}-01`);
    expect(month.gridStart <= month.monthStart).toBe(true);
    expect(month.gridEnd > month.monthStart).toBe(true);
  });

  test("the members list can be narrowed to staff", async () => {
    const staff = await org.caller.organizations.members.list({
      page: 1,
      perPage: 100,
      sorting: [],
      roles: ["admin", "teacher"],
    });
    const userIds = staff.rows.map((row) => row.userId);
    expect(userIds).toContain(org.userId);
    expect(userIds).not.toContain(student.userId);
    expect(staff.rows.every((row) => row.role !== "student")).toBe(true);
  });
});
