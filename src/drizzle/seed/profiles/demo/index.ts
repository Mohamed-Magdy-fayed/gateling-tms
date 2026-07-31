import { eq } from "drizzle-orm";
import { db } from "@/drizzle";
import { OrganizationsTable } from "@/drizzle/schema";
import { countOrganizationUsage } from "@/features/core/organizations/server/usage";
import { SEED_ORG_ID, SEED_TEACHER_ID } from "../../constants";
import { seedBaselineProfile } from "../baseline";
import { seedDemoCourse } from "./content";
import { DEMO_COURSES, DEMO_TRAINEES } from "./data";
import {
  seedDemoGroup,
  seedDemoMeetingAccountFixture,
  seedDemoSessionsForGroup,
} from "./groups";
import { seedDemoTestimonial } from "./showcase";
import {
  seedDemoAttendance,
  seedDemoCertificate,
  seedDemoEnrollment,
  seedDemoEnrollmentLevel,
  seedDemoGroupStudent,
  seedDemoTrainee,
} from "./trainees";

// How many of a group's earliest generated sessions already "happened" and
// get attendance recorded — fixture data, not tied to the real wall clock.
const ATTENDANCE_SESSION_COUNT = 4;

/**
 * The realistic-academy screenshot/demo dataset: 2 courses (levels +
 * lectures + a quiz each), 3 groups with weekly schedules and generated
 * sessions (one onMeeting-fixture-connected), 25 trainees spread across the
 * groups with enrollments, level progress, attendance on past sessions, and
 * certificates for completed enrollments.
 *
 * Builds on top of `baseline` (same org/admin/teacher/students) rather than
 * creating a second organization — this is meant to be the org you log into
 * with the already-documented dev credentials and see fully populated.
 */
export async function seedDemoProfile() {
  await seedBaselineProfile();

  const [organization] = await db
    .select()
    .from(OrganizationsTable)
    .where(eq(OrganizationsTable.id, SEED_ORG_ID))
    .limit(1);

  const [englishCourseSeed, businessCourseSeed] = DEMO_COURSES;
  const english = await seedDemoCourse(organization.id, englishCourseSeed);
  const business = await seedDemoCourse(organization.id, businessCourseSeed);

  const meetingFixture = await seedDemoMeetingAccountFixture(organization.id);

  const groupA = await seedDemoGroup({
    organizationId: organization.id,
    name: "Beginner Batch A",
    courseId: english.course.id,
    teacherId: SEED_TEACHER_ID,
    schedule: [
      { day: 0, startTime: "18:00", endTime: "20:00" },
      { day: 2, startTime: "18:00", endTime: "20:00" },
    ],
    startDate: "2026-06-01",
    sessionCount: 12,
  });
  const groupB = await seedDemoGroup({
    organizationId: organization.id,
    name: "Elementary Batch B",
    courseId: english.course.id,
    teacherId: SEED_TEACHER_ID,
    schedule: [
      { day: 1, startTime: "17:00", endTime: "19:00" },
      { day: 3, startTime: "17:00", endTime: "19:00" },
    ],
    startDate: "2026-06-02",
    sessionCount: 12,
  });
  const groupC = await seedDemoGroup({
    organizationId: organization.id,
    name: "Business Batch C",
    courseId: business.course.id,
    teacherId: SEED_TEACHER_ID,
    schedule: [{ day: 4, startTime: "19:00", endTime: "21:00" }],
    startDate: "2026-06-04",
    sessionCount: 12,
  });

  const groupASessions = await seedDemoSessionsForGroup({
    organizationId: organization.id,
    group: groupA,
    timeZone: organization.timeZone,
    meetingFixture: { meetingAccountId: meetingFixture.id },
  });
  const groupBSessions = await seedDemoSessionsForGroup({
    organizationId: organization.id,
    group: groupB,
    timeZone: organization.timeZone,
  });
  const groupCSessions = await seedDemoSessionsForGroup({
    organizationId: organization.id,
    group: groupC,
    timeZone: organization.timeZone,
  });
  const totalSessionCount =
    groupASessions.length + groupBSessions.length + groupCSessions.length;

  // 9 / 8 / 8 across the three groups.
  const groupAssignments = [
    ...Array(9).fill({ group: groupA, course: english }),
    ...Array(8).fill({ group: groupB, course: english }),
    ...Array(8).fill({ group: groupC, course: business }),
  ];
  if (groupAssignments.length !== DEMO_TRAINEES.length) {
    throw new Error(
      `groupAssignments (${groupAssignments.length}) and DEMO_TRAINEES (${DEMO_TRAINEES.length}) must stay in sync.`,
    );
  }

  const trainees = [];
  for (const [index, traineeSeed] of DEMO_TRAINEES.entries()) {
    const trainee = await seedDemoTrainee(organization.id, traineeSeed);
    const assignment = groupAssignments[index];
    await seedDemoGroupStudent(
      organization.id,
      assignment.group.id,
      trainee.id,
    );
    trainees.push({ trainee, assignment });
  }

  for (const [index, { trainee, assignment }] of trainees.entries()) {
    const status =
      index <= 4
        ? "completed"
        : index <= 16
          ? "ongoing"
          : index <= 20
            ? "waiting"
            : index <= 22
              ? "placementTest"
              : index === 23
                ? "postponed"
                : "cancelled";

    const enrollment = await seedDemoEnrollment({
      organizationId: organization.id,
      traineeId: trainee.id,
      courseId: assignment.course.course.id,
      status,
    });

    if (status === "ongoing" || status === "completed") {
      const [firstLevelId, secondLevelId] = assignment.course.levelIds;
      await seedDemoEnrollmentLevel({
        organizationId: organization.id,
        enrollmentId: enrollment.id,
        levelId: firstLevelId,
        status: "completed",
        completedAt: new Date("2026-06-20T12:00:00Z"),
      });
      await seedDemoEnrollmentLevel({
        organizationId: organization.id,
        enrollmentId: enrollment.id,
        levelId: secondLevelId,
        status: status === "completed" ? "completed" : "inProgress",
        completedAt:
          status === "completed" ? new Date("2026-07-15T12:00:00Z") : undefined,
      });
    }

    if (status === "completed") {
      await seedDemoCertificate({
        organizationId: organization.id,
        traineeId: trainee.id,
        courseId: assignment.course.course.id,
        groupId: assignment.group.id,
        title: `${trainee.name} — ${assignment.course.course.name} Certificate of Completion`,
      });
    }
  }

  // Attendance on Group A's earliest sessions, for Group A's roster only.
  const groupATrainees = trainees.filter(
    ({ assignment }) => assignment.group.id === groupA.id,
  );
  const pastSessions = groupASessions.slice(0, ATTENDANCE_SESSION_COUNT);
  for (const [sessionIndex, session] of pastSessions.entries()) {
    for (const [traineeIndex, { trainee }] of groupATrainees.entries()) {
      const present = (sessionIndex + traineeIndex) % 5 !== 0;
      await seedDemoAttendance({
        organizationId: organization.id,
        session,
        traineeId: trainee.id,
        present,
        markedBy: SEED_TEACHER_ID,
      });
    }
  }

  await seedDemoTestimonial(organization.id);

  const usage = await countOrganizationUsage(db, organization.id);
  await db
    .update(OrganizationsTable)
    .set(usage)
    .where(eq(OrganizationsTable.id, organization.id));

  console.info(
    "Demo profile ready: 2 courses, 3 groups (%d sessions total), %d trainees.",
    totalSessionCount,
    trainees.length,
  );

  return { profile: "demo" as const };
}
