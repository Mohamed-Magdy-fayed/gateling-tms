import { count, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { db } from "@/drizzle";
import {
  AnswersTable,
  CertificatesTable,
  CoursesTable,
  EnrollmentLevelsTable,
  EnrollmentsTable,
  FormResponsesTable,
  FormSectionsTable,
  FormsTable,
  GroupStudentsTable,
  GroupsTable,
  LecturesTable,
  LevelsTable,
  MeetingAccountsTable,
  PlacementTestsTable,
  QuestionsTable,
  SessionStudentsTable,
  SessionsTable,
  TestimonialsTable,
  TraineesTable,
} from "@/drizzle/schema";
import {
  createTenant,
  destroyTenant,
  errorCodeOf,
  type TenantFixture,
} from "./lib/harness";
import { seedTenantData, type TenantData } from "./lib/tenant-fixtures";

/**
 * The tenancy invariant, exercised end to end against a real database
 * (`docs/rebuild/README.md` rule 6, `phase-08.md` step 5's "org-isolation test
 * suite covers **every** tenant table").
 *
 * Two organizations, each with a row in all 21 tenant-owned tables. Every
 * assertion is org A's admin — a genuine, fully-authorized user — reaching for
 * org B's data by id. The caller goes through the real `orgProcedure`, which
 * resolves the membership from the database, so nothing here is stubbed except
 * the session cookie that a browser would have carried.
 *
 * ## Table coverage
 *
 * Directly addressed by a route in this file:
 *   courses, levels, lectures, trainees, groups, group_students, enrollments,
 *   forms, form_sections, questions, answers, form_responses, placement_tests,
 *   certificates, meeting_accounts, sessions, session_students, testimonials,
 *   google_integrations
 *
 * Reachable only through a parent, and covered by that parent's refusal:
 *   enrollment_levels  → `enrollments.levels` (takes the enrollment id)
 *   organization_memberships → `organizations.members.list`, which has no id
 *     input at all; it is covered by asserting A's member list never contains
 *     B's admin.
 *
 * That is all 21. A new tenant-owned table must be added here in the same
 * change that adds the table.
 */

let orgA: TenantFixture;
let orgB: TenantFixture;
let dataA: TenantData;
let dataB: TenantData;

beforeAll(async () => {
  orgA = await createTenant("ISOA", "Isolation Org A");
  orgB = await createTenant("ISOB", "Isolation Org B");
  dataA = await seedTenantData(orgA);
  dataB = await seedTenantData(orgB);
});

afterAll(async () => {
  await destroyTenant(orgA);
  await destroyTenant(orgB);
});

/**
 * A cross-tenant read must not succeed with data. Refusing outright and
 * returning nothing are both correct — a `get` throws NOT_FOUND, a scoped list
 * comes back empty — so this accepts either and fails on anything else,
 * including a resolved value that actually contains the other tenant's row.
 */
async function expectDeniedOrEmpty(call: Promise<unknown>, label: string) {
  let result: unknown;
  try {
    result = await call;
  } catch (error) {
    const code = (error as { code?: string })?.code;
    expect(
      ["NOT_FOUND", "FORBIDDEN", "BAD_REQUEST"],
      `${label} threw ${code}`,
    ).toContain(code);
    return;
  }

  if (Array.isArray(result)) {
    expect(result, `${label} returned rows`).toHaveLength(0);
    return;
  }

  if (result && typeof result === "object" && "rows" in result) {
    expect(
      (result as { rows: unknown[] }).rows,
      `${label} returned rows`,
    ).toHaveLength(0);
    return;
  }

  expect(
    result,
    `${label} resolved with the other tenant's record`,
  ).toBeFalsy();
}

describe("cross-tenant reads by id", () => {
  test("courses.get refuses another org's course", async () => {
    await expectDeniedOrEmpty(
      orgA.caller.courses.get({ id: dataB.courseId }),
      "courses.get",
    );
  });

  test("levels.list refuses another org's course", async () => {
    await expectDeniedOrEmpty(
      orgA.caller.levels.list({ courseId: dataB.courseId }),
      "levels.list",
    );
  });

  test("lectures.list refuses another org's level", async () => {
    await expectDeniedOrEmpty(
      orgA.caller.lectures.list({ levelId: dataB.levelId }),
      "lectures.list",
    );
  });

  test("trainees.get refuses another org's trainee", async () => {
    await expectDeniedOrEmpty(
      orgA.caller.trainees.get({ id: dataB.traineeId }),
      "trainees.get",
    );
  });

  test("groups.get refuses another org's group", async () => {
    await expectDeniedOrEmpty(
      orgA.caller.groups.get({ id: dataB.groupId }),
      "groups.get",
    );
  });

  test("groups.students refuses another org's group roster", async () => {
    await expectDeniedOrEmpty(
      orgA.caller.groups.students({ id: dataB.groupId }),
      "groups.students",
    );
  });

  test("enrollments.get refuses another org's enrollment", async () => {
    await expectDeniedOrEmpty(
      orgA.caller.enrollments.get({ id: dataB.enrollmentId }),
      "enrollments.get",
    );
  });

  test("enrollments.levels refuses another org's enrollment levels", async () => {
    await expectDeniedOrEmpty(
      orgA.caller.enrollments.levels({ id: dataB.enrollmentId }),
      "enrollments.levels",
    );
  });

  test("forms.get refuses another org's form", async () => {
    await expectDeniedOrEmpty(
      orgA.caller.forms.get({ id: dataB.formId }),
      "forms.get",
    );
  });

  test("forms.getTree refuses another org's form", async () => {
    await expectDeniedOrEmpty(
      orgA.caller.forms.getTree({ id: dataB.formId }),
      "forms.getTree",
    );
  });

  test("sections.list refuses another org's form", async () => {
    await expectDeniedOrEmpty(
      orgA.caller.sections.list({ formId: dataB.formId }),
      "sections.list",
    );
  });

  test("questions.list refuses another org's section", async () => {
    await expectDeniedOrEmpty(
      orgA.caller.questions.list({ sectionId: dataB.sectionId }),
      "questions.list",
    );
  });

  test("answers.list refuses another org's question", async () => {
    await expectDeniedOrEmpty(
      orgA.caller.answers.list({ questionId: dataB.questionId }),
      "answers.list",
    );
  });

  test("responses.list refuses another org's form responses", async () => {
    await expectDeniedOrEmpty(
      orgA.caller.responses.list({ formId: dataB.formId }),
      "responses.list",
    );
  });

  test("responses.gradingSheet refuses another org's response", async () => {
    await expectDeniedOrEmpty(
      orgA.caller.responses.gradingSheet({ responseId: dataB.responseId }),
      "responses.gradingSheet",
    );
  });

  test("placementTests.get refuses another org's placement test", async () => {
    await expectDeniedOrEmpty(
      orgA.caller.placementTests.get({ id: dataB.placementTestId }),
      "placementTests.get",
    );
  });

  test("certificates.get refuses another org's certificate", async () => {
    await expectDeniedOrEmpty(
      orgA.caller.certificates.get({ id: dataB.certificateId }),
      "certificates.get",
    );
  });

  test("meetingAccounts.get refuses another org's room", async () => {
    await expectDeniedOrEmpty(
      orgA.caller.meetingAccounts.get({ id: dataB.meetingAccountId }),
      "meetingAccounts.get",
    );
  });

  test("sessions.byGroup refuses another org's group", async () => {
    await expectDeniedOrEmpty(
      orgA.caller.sessions.byGroup({ groupId: dataB.groupId }),
      "sessions.byGroup",
    );
  });

  test("attendance.bySession refuses another org's register", async () => {
    await expectDeniedOrEmpty(
      orgA.caller.attendance.bySession({ sessionId: dataB.sessionId }),
      "attendance.bySession",
    );
  });

  test("progress.trainee refuses another org's trainee", async () => {
    await expectDeniedOrEmpty(
      orgA.caller.progress.trainee({ traineeId: dataB.traineeId }),
      "progress.trainee",
    );
  });

  test("progress.group refuses another org's group", async () => {
    await expectDeniedOrEmpty(
      orgA.caller.progress.group({ groupId: dataB.groupId }),
      "progress.group",
    );
  });
});

describe("scoped lists never contain another tenant's rows", () => {
  const listInput = { page: 1, perPage: 100, sorting: [] };

  test("courses.list", async () => {
    const result = await orgA.caller.courses.list(listInput);
    expect(result.rows.map((row) => row.id)).not.toContain(dataB.courseId);
    expect(result.rows.map((row) => row.id)).toContain(dataA.courseId);
  });

  test("trainees.list", async () => {
    const result = await orgA.caller.trainees.list(listInput);
    expect(result.rows.map((row) => row.id)).not.toContain(dataB.traineeId);
    expect(result.rows.map((row) => row.id)).toContain(dataA.traineeId);
  });

  test("groups.list", async () => {
    const result = await orgA.caller.groups.list(listInput);
    expect(result.rows.map((row) => row.id)).not.toContain(dataB.groupId);
  });

  test("enrollments.list", async () => {
    const result = await orgA.caller.enrollments.list(listInput);
    expect(result.rows.map((row) => row.id)).not.toContain(dataB.enrollmentId);
  });

  test("certificates.list", async () => {
    const result = await orgA.caller.certificates.list(listInput);
    expect(result.rows.map((row) => row.id)).not.toContain(dataB.certificateId);
  });

  test("forms.list", async () => {
    const result = await orgA.caller.forms.list(listInput);
    expect(result.rows.map((row) => row.id)).not.toContain(dataB.formId);
  });

  test("meetingAccounts.list", async () => {
    const result = await orgA.caller.meetingAccounts.list(listInput);
    expect(result.rows.map((row) => row.id)).not.toContain(
      dataB.meetingAccountId,
    );
  });

  test("sessions.list", async () => {
    const result = await orgA.caller.sessions.list({
      page: 1,
      perPage: 100,
      scope: "upcoming",
    });
    expect(result.rows.map((row) => row.id)).not.toContain(dataB.sessionId);
  });

  test("placementTests.list is scoped to the caller's own trainee", async () => {
    const result = await orgA.caller.placementTests.list({
      traineeId: dataA.traineeId,
    });
    expect(result.map((row) => row.id)).not.toContain(dataB.placementTestId);
  });

  // organization_memberships: no id-addressable route, so the members list is
  // where a leak would show.
  test("organizations.members.list", async () => {
    const result = await orgA.caller.organizations.members.list(listInput);
    const emails = result.rows.map((row) => row.email);
    expect(emails).not.toContain(orgB.email);
    expect(emails).toContain(orgA.email);
  });

  // testimonials: the org-scoped read returns the caller's own row only.
  test("testimonials.status returns only the caller's own testimonial", async () => {
    const result = await orgA.caller.testimonials.status();
    expect(result.testimonial?.quote).toContain(orgA.organizationId);
    expect(result.testimonial?.quote).not.toContain(orgB.organizationId);
  });

  // google_integrations: same shape — one per org, read without an id.
  test("googleImport.get returns only the caller's own grant", async () => {
    const result = await orgA.caller.googleImport.get();
    expect(result?.googleEmail).toContain(orgA.organizationId);
    expect(result?.googleEmail).not.toContain(orgB.organizationId);
  });

  // Not `dashboard.overview`: its counts come from the denormalized counters on
  // the organization row, which only the create routes maintain, so direct
  // fixture inserts leave them at zero and the assertion would be vacuous.
  // `recentActivity` reads the real tables.
  test("dashboard.recentActivity shows only the caller's own org", async () => {
    const activity = await orgA.caller.dashboard.recentActivity();
    const enrollmentIds = activity.enrollments.map((row) => row.id);
    const certificateIds = activity.certificates.map((row) => row.id);

    expect(enrollmentIds).toContain(dataA.enrollmentId);
    expect(enrollmentIds).not.toContain(dataB.enrollmentId);
    expect(certificateIds).toContain(dataA.certificateId);
    expect(certificateIds).not.toContain(dataB.certificateId);
  });
});

/**
 * Writes matter more than reads: a refused read leaks nothing, but an accepted
 * cross-tenant write corrupts the other tenant's data. Each case asserts both
 * that the call was refused **for tenancy reasons** and that org B's row is
 * unchanged afterwards — "it threw" is not by itself proof that nothing was
 * written, and neither is a rejection that came from somewhere else entirely.
 */
describe("cross-tenant writes are refused and change nothing", () => {
  async function rowCount(
    // biome-ignore lint/suspicious/noExplicitAny: a heterogeneous set of Drizzle tables; the shared shape is only "has an id column".
    table: any,
    id: string,
  ): Promise<number> {
    const [row] = await db
      .select({ value: count() })
      .from(table)
      .where(eq(table.id, id));
    return row?.value ?? 0;
  }

  /**
   * Asserts the call was refused, and refused *for tenancy reasons*.
   *
   * `errorCodeOf` reports `"UNKNOWN"` for any non-tRPC rejection, so a bare
   * "it threw" would also pass when the call died of something unrelated — a
   * missing environment value, an unreachable external service — and the test
   * would be proving nothing about isolation. Naming the acceptable codes is
   * what turns the rejection into evidence.
   */
  async function expectTenantRefusal(call: Promise<unknown>, label: string) {
    const code = await errorCodeOf(call);
    expect(code, `${label} resolved instead of refusing`).not.toBeNull();
    expect(
      ["NOT_FOUND", "FORBIDDEN", "BAD_REQUEST"],
      `${label} refused with ${code}, which is not a tenancy refusal`,
    ).toContain(code);
  }

  test("courses.update leaves another org's course alone", async () => {
    await expectTenantRefusal(
      orgA.caller.courses.update({
        id: dataB.courseId,
        name: "Hijacked",
        description: "",
        thumbnailUrl: "",
      }),
      "courses.update",
    );

    const [course] = await db
      .select({ name: CoursesTable.name })
      .from(CoursesTable)
      .where(eq(CoursesTable.id, dataB.courseId));
    expect(course.name).toBe("Isolation Course");
  });

  test("courses.delete leaves another org's course alone", async () => {
    await expectTenantRefusal(
      orgA.caller.courses.delete({ id: dataB.courseId }),
      "courses.delete",
    );
    expect(await rowCount(CoursesTable, dataB.courseId)).toBe(1);
  });

  test("levels.delete leaves another org's level alone", async () => {
    await expectTenantRefusal(
      orgA.caller.levels.delete({ id: dataB.levelId }),
      "levels.delete",
    );
    expect(await rowCount(LevelsTable, dataB.levelId)).toBe(1);
  });

  test("lectures.delete leaves another org's lecture alone", async () => {
    await expectTenantRefusal(
      orgA.caller.lectures.delete({ id: dataB.lectureId }),
      "lectures.delete",
    );
    expect(await rowCount(LecturesTable, dataB.lectureId)).toBe(1);
  });

  test("trainees.delete leaves another org's trainee alone", async () => {
    await expectTenantRefusal(
      orgA.caller.trainees.delete({ id: dataB.traineeId }),
      "trainees.delete",
    );
    expect(await rowCount(TraineesTable, dataB.traineeId)).toBe(1);
  });

  test("groups.delete leaves another org's group alone", async () => {
    await expectTenantRefusal(
      orgA.caller.groups.delete({ id: dataB.groupId }),
      "groups.delete",
    );
    expect(await rowCount(GroupsTable, dataB.groupId)).toBe(1);
  });

  test("groups.removeStudent leaves another org's roster alone", async () => {
    await expectTenantRefusal(
      orgA.caller.groups.removeStudent({
        groupId: dataB.groupId,
        traineeId: dataB.traineeId,
      }),
      "groups.removeStudent",
    );
    expect(await rowCount(GroupStudentsTable, dataB.groupStudentId)).toBe(1);
  });

  test("enrollments.delete leaves another org's enrollment alone", async () => {
    await expectTenantRefusal(
      orgA.caller.enrollments.delete({ id: dataB.enrollmentId }),
      "enrollments.delete",
    );
    expect(await rowCount(EnrollmentsTable, dataB.enrollmentId)).toBe(1);
  });

  test("enrollments.setLevelStatus leaves another org's progress alone", async () => {
    await expectTenantRefusal(
      orgA.caller.enrollments.setLevelStatus({
        enrollmentId: dataB.enrollmentId,
        levelId: dataB.levelId,
        status: "completed",
      }),
      "enrollments.setLevelStatus",
    );

    const [enrollmentLevel] = await db
      .select({ status: EnrollmentLevelsTable.status })
      .from(EnrollmentLevelsTable)
      .where(eq(EnrollmentLevelsTable.id, dataB.enrollmentLevelId));
    expect(enrollmentLevel.status).toBe("inProgress");
  });

  test("forms.delete leaves another org's form alone", async () => {
    await expectTenantRefusal(
      orgA.caller.forms.delete({ id: dataB.formId }),
      "forms.delete",
    );
    expect(await rowCount(FormsTable, dataB.formId)).toBe(1);
  });

  test("sections.delete leaves another org's section alone", async () => {
    await expectTenantRefusal(
      orgA.caller.sections.delete({ id: dataB.sectionId }),
      "sections.delete",
    );
    expect(await rowCount(FormSectionsTable, dataB.sectionId)).toBe(1);
  });

  test("questions.delete leaves another org's question alone", async () => {
    await expectTenantRefusal(
      orgA.caller.questions.delete({ id: dataB.questionId }),
      "questions.delete",
    );
    expect(await rowCount(QuestionsTable, dataB.questionId)).toBe(1);
  });

  test("answers.delete leaves another org's answer alone", async () => {
    await expectTenantRefusal(
      orgA.caller.answers.delete({ id: dataB.answerId }),
      "answers.delete",
    );
    expect(await rowCount(AnswersTable, dataB.answerId)).toBe(1);
  });

  test("responses.grade leaves another org's response alone", async () => {
    await expectTenantRefusal(
      orgA.caller.responses.grade({ responseId: dataB.responseId, score: 99 }),
      "responses.grade",
    );

    const [response] = await db
      .select({ score: FormResponsesTable.score })
      .from(FormResponsesTable)
      .where(eq(FormResponsesTable.id, dataB.responseId));
    expect(response.score).toBeNull();
  });

  test("placementTests.delete leaves another org's placement test alone", async () => {
    await expectTenantRefusal(
      orgA.caller.placementTests.delete({ id: dataB.placementTestId }),
      "placementTests.delete",
    );
    expect(await rowCount(PlacementTestsTable, dataB.placementTestId)).toBe(1);
  });

  test("certificates.delete leaves another org's certificate alone", async () => {
    await expectTenantRefusal(
      orgA.caller.certificates.delete({ id: dataB.certificateId }),
      "certificates.delete",
    );
    expect(await rowCount(CertificatesTable, dataB.certificateId)).toBe(1);
  });

  test("meetingAccounts.rename leaves another org's room alone", async () => {
    await expectTenantRefusal(
      orgA.caller.meetingAccounts.rename({
        id: dataB.meetingAccountId,
        name: "Hijacked",
      }),
      "meetingAccounts.rename",
    );

    const [room] = await db
      .select({ name: MeetingAccountsTable.name })
      .from(MeetingAccountsTable)
      .where(eq(MeetingAccountsTable.id, dataB.meetingAccountId));
    expect(room.name).toBe("Isolation Room");
  });

  test("attendance.mark leaves another org's register alone", async () => {
    await expectTenantRefusal(
      orgA.caller.attendance.mark({
        sessionId: dataB.sessionId,
        traineeId: dataB.traineeId,
        status: "absent",
      }),
      "attendance.mark",
    );

    const [register] = await db
      .select({ status: SessionStudentsTable.status })
      .from(SessionStudentsTable)
      .where(eq(SessionStudentsTable.id, dataB.sessionStudentId));
    expect(register.status).toBe("present");
  });

  test("sessions.startMeeting refuses another org's session", async () => {
    await expectTenantRefusal(
      orgA.caller.sessions.startMeeting({ id: dataB.sessionId }),
      "sessions.startMeeting",
    );

    // No meeting was provisioned onto B's session — the join link is the
    // artefact a successful start would have written.
    const [session] = await db
      .select({ joinUrl: SessionsTable.joinUrl })
      .from(SessionsTable)
      .where(eq(SessionsTable.id, dataB.sessionId));
    expect(session.joinUrl).toBeNull();
  });

  // The submit path is an upsert keyed on the caller's own organizationId, so
  // the check is that writing as A never touches B's row.
  test("testimonials.submit only ever writes the caller's own row", async () => {
    await orgA.caller.testimonials.submit({
      quote: "Rewritten by org A",
      authorName: "Org A",
      authorRole: "",
      imageUrl: "",
      isPublic: false,
    });

    const [otherTenantsRow] = await db
      .select({ quote: TestimonialsTable.quote })
      .from(TestimonialsTable)
      .where(eq(TestimonialsTable.id, dataB.testimonialId));
    expect(otherTenantsRow.quote).toContain(orgB.organizationId);
  });
});
