import { db } from "@/drizzle";
import {
  AnswersTable,
  CertificatesTable,
  CoursesTable,
  EnrollmentLevelsTable,
  EnrollmentsTable,
  FormBlocksTable,
  FormResponsesTable,
  FormSectionsTable,
  FormsTable,
  GoogleIntegrationsTable,
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
import type { TenantFixture } from "./harness";

const ACTOR = "integration-test";

/**
 * One row in **every** tenant-owned table, written directly.
 *
 * Direct inserts rather than the create routes on purpose: the subject of this
 * suite is the read and write routes' tenant filtering, not their create paths,
 * and going through the routers would make the fixtures depend on Inngest being
 * reachable (group scheduling) and on credentials nobody has in a test (the
 * onMeeting connect exchange, the Google grant).
 *
 * Every id is returned so the isolation assertions can ask for a specific row
 * belonging to the *other* tenant by id.
 */
export type TenantData = Awaited<ReturnType<typeof seedTenantData>>;

export async function seedTenantData(tenant: TenantFixture) {
  const organizationId = tenant.organizationId;

  const [course] = await db
    .insert(CoursesTable)
    .values({
      organizationId,
      name: "Isolation Course",
      description: "Fixture",
      createdBy: ACTOR,
    })
    .returning({ id: CoursesTable.id });

  const [level] = await db
    .insert(LevelsTable)
    .values({
      organizationId,
      courseId: course.id,
      name: "Isolation Level",
    })
    .returning({ id: LevelsTable.id });

  const [lecture] = await db
    .insert(LecturesTable)
    .values({
      organizationId,
      levelId: level.id,
      name: "Isolation Lecture",
    })
    .returning({ id: LecturesTable.id });

  const [trainee] = await db
    .insert(TraineesTable)
    .values({
      organizationId,
      name: "Isolation Trainee",
      email: `trainee-${organizationId}@integration.test`,
      createdBy: ACTOR,
    })
    .returning({ id: TraineesTable.id });

  const [group] = await db
    .insert(GroupsTable)
    .values({
      organizationId,
      name: "Isolation Group",
      courseId: course.id,
      schedule: [{ day: 1, startTime: "18:00", endTime: "20:00" }],
    })
    .returning({ id: GroupsTable.id });

  const [groupStudent] = await db
    .insert(GroupStudentsTable)
    .values({ organizationId, groupId: group.id, traineeId: trainee.id })
    .returning({ id: GroupStudentsTable.id });

  const [enrollment] = await db
    .insert(EnrollmentsTable)
    .values({
      organizationId,
      traineeId: trainee.id,
      courseId: course.id,
      status: "ongoing",
    })
    .returning({ id: EnrollmentsTable.id });

  const [enrollmentLevel] = await db
    .insert(EnrollmentLevelsTable)
    .values({
      organizationId,
      enrollmentId: enrollment.id,
      levelId: level.id,
      status: "inProgress",
    })
    .returning({ id: EnrollmentLevelsTable.id });

  const [form] = await db
    .insert(FormsTable)
    .values({
      organizationId,
      courseId: course.id,
      type: "quiz",
      status: "published",
      title: "Isolation Form",
    })
    .returning({ id: FormsTable.id });

  const [section] = await db
    .insert(FormSectionsTable)
    .values({ organizationId, formId: form.id, title: "Isolation Section" })
    .returning({ id: FormSectionsTable.id });

  const [block] = await db
    .insert(FormBlocksTable)
    .values({
      organizationId,
      sectionId: section.id,
      kind: "text",
      title: "Isolation Passage",
      body: "Fixture",
      // Questions and blocks share one order sequence per section.
      order: 0,
    })
    .returning({ id: FormBlocksTable.id });

  const [question] = await db
    .insert(QuestionsTable)
    .values({
      organizationId,
      sectionId: section.id,
      text: "Isolation question?",
      type: "single_choice",
      order: 1,
    })
    .returning({ id: QuestionsTable.id });

  const [answer] = await db
    .insert(AnswersTable)
    .values({
      organizationId,
      questionId: question.id,
      text: "Isolation answer",
      isCorrect: true,
    })
    .returning({ id: AnswersTable.id });

  const [response] = await db
    .insert(FormResponsesTable)
    .values({
      organizationId,
      formId: form.id,
      respondentUserId: tenant.userId,
      answers: [],
    })
    .returning({ id: FormResponsesTable.id });

  const [placementTest] = await db
    .insert(PlacementTestsTable)
    .values({
      organizationId,
      traineeId: trainee.id,
      formId: form.id,
      status: "pending",
    })
    .returning({ id: PlacementTestsTable.id });

  const [certificate] = await db
    .insert(CertificatesTable)
    .values({
      organizationId,
      traineeId: trainee.id,
      courseId: course.id,
      groupId: group.id,
      title: "Isolation Certificate",
    })
    .returning({ id: CertificatesTable.id });

  const [meetingAccount] = await db
    .insert(MeetingAccountsTable)
    .values({
      organizationId,
      name: "Isolation Room",
      accountId: `isolation-${organizationId}`,
      roomCode: `ISO-${organizationId.slice(0, 8)}`,
      roomName: "Isolation Room",
      createdBy: ACTOR,
    })
    .returning({ id: MeetingAccountsTable.id });

  const [session] = await db
    .insert(SessionsTable)
    .values({
      organizationId,
      groupId: group.id,
      scheduledAt: new Date("2026-09-01T18:00:00Z"),
      durationMinutes: 120,
      meetingAccountId: meetingAccount.id,
    })
    .returning({ id: SessionsTable.id });

  const [sessionStudent] = await db
    .insert(SessionStudentsTable)
    .values({
      organizationId,
      sessionId: session.id,
      traineeId: trainee.id,
      status: "present",
      source: "manual",
    })
    .returning({ id: SessionStudentsTable.id });

  const [googleIntegration] = await db
    .insert(GoogleIntegrationsTable)
    .values({
      organizationId,
      accessToken: "isolation-fixture-ciphertext",
      refreshToken: "isolation-fixture-ciphertext",
      scope: "https://www.googleapis.com/auth/forms.body.readonly",
      expiresAt: new Date(Date.now() + 3_600_000),
      googleEmail: `google-${organizationId}@integration.test`,
      createdBy: ACTOR,
    })
    .returning({ id: GoogleIntegrationsTable.id });

  const [testimonial] = await db
    .insert(TestimonialsTable)
    .values({
      organizationId,
      authorUserId: tenant.userId,
      quote: `Isolation testimonial for ${organizationId}`,
      authorName: "Isolation Author",
      isPublic: false,
      createdBy: ACTOR,
    })
    .returning({ id: TestimonialsTable.id });

  return {
    answerId: answer.id,
    blockId: block.id,
    certificateId: certificate.id,
    courseId: course.id,
    enrollmentId: enrollment.id,
    enrollmentLevelId: enrollmentLevel.id,
    formId: form.id,
    googleIntegrationId: googleIntegration.id,
    groupId: group.id,
    groupStudentId: groupStudent.id,
    lectureId: lecture.id,
    levelId: level.id,
    meetingAccountId: meetingAccount.id,
    placementTestId: placementTest.id,
    questionId: question.id,
    responseId: response.id,
    sectionId: section.id,
    sessionId: session.id,
    sessionStudentId: sessionStudent.id,
    testimonialId: testimonial.id,
    traineeId: trainee.id,
  };
}
