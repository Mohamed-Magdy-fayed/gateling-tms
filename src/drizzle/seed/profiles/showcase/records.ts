import type {
  EnrollmentLevelsTable,
  EnrollmentsTable,
  GroupStudentsTable,
  GroupsTable,
  OrganizationMembershipsTable,
  PlacementTestsTable,
  SessionsTable,
  TeacherAvailabilityTable,
  TraineesTable,
  UsersTable,
} from "@/drizzle/schema";
import { SEED_SYSTEM_ACTOR } from "../../constants";
import {
  DAY_PAIRS,
  FIRST_NAMES,
  LAST_NAMES,
  PLACEMENT_FEEDBACK,
  SHOWCASE_TEACHERS,
} from "./catalog";
import type { Cohort, PlannedTrainee } from "./cohorts";
import { CONTENT_CREATED_AT } from "./content";
import { addMinutes, rngFor, stableId } from "./determinism";
import {
  enrollmentLevelAt,
  enrollmentStatusAt,
  groupStatusAt,
  isOnRoster,
  sessionStatusAt,
} from "./lifecycle";

/** One in this many trainees has a student portal account (and so can submit forms). */
export const PORTAL_ACCOUNT_EVERY = 6;
const STUDENT_EMAIL_DOMAIN = "students.horizon-academy.example";

export type StructureRows = {
  users: (typeof UsersTable.$inferInsert)[];
  memberships: (typeof OrganizationMembershipsTable.$inferInsert)[];
  availability: (typeof TeacherAvailabilityTable.$inferInsert)[];
  groups: (typeof GroupsTable.$inferInsert)[];
  sessions: (typeof SessionsTable.$inferInsert)[];
  trainees: (typeof TraineesTable.$inferInsert)[];
  groupStudents: (typeof GroupStudentsTable.$inferInsert)[];
  enrollments: (typeof EnrollmentsTable.$inferInsert)[];
  enrollmentLevels: (typeof EnrollmentLevelsTable.$inferInsert)[];
  placementTests: (typeof PlacementTestsTable.$inferInsert)[];
};

export type TraineeProfile = {
  id: string;
  name: string;
  email: string;
  userId: string | null;
};

const exists = (createdAt: Date, now: Date) =>
  createdAt.getTime() <= now.getTime();

export function traineeProfile(
  trainee: PlannedTrainee,
): TraineeProfile & { phone: string } {
  const rng = rngFor(`trainee-name:${trainee.number}`);
  const first = rng.pick(FIRST_NAMES);
  const last = rng.pick(LAST_NAMES);
  const phone = `+20${rng.pick(["10", "11", "12", "15"])}${String(rng.int(0, 99_999_999)).padStart(8, "0")}`;
  return {
    id: trainee.id,
    name: `${first} ${last}`,
    email:
      `${first}.${last}.${trainee.number + 1}@${STUDENT_EMAIL_DOMAIN}`.toLowerCase(),
    phone,
    userId:
      trainee.number % PORTAL_ACCOUNT_EVERY === 0
        ? stableId(`student-user:${trainee.number}`)
        : null,
  };
}

/** Teachers: users (no password — they never sign in to the showcase), memberships, availability. */
function planStaff(organizationId: string, rows: StructureRows) {
  for (const teacher of SHOWCASE_TEACHERS) {
    const userId = stableId(`teacher:${teacher.key}`);
    rows.users.push({
      id: userId,
      email: teacher.email,
      name: teacher.name,
      emailVerifiedAt: CONTENT_CREATED_AT,
      createdAt: CONTENT_CREATED_AT,
      createdBy: SEED_SYSTEM_ACTOR,
    });
    rows.memberships.push({
      organizationId,
      userId,
      role: "teacher",
      createdAt: CONTENT_CREATED_AT,
    });
    for (const [pairIndex, pair] of DAY_PAIRS.entries()) {
      for (const day of pair) {
        rows.availability.push({
          id: stableId(`availability:${teacher.key}:${pairIndex}:${day}`),
          organizationId,
          teacherId: userId,
          day,
          startTime: teacher.times[0],
          endTime: "22:00",
          createdAt: CONTENT_CREATED_AT,
          updatedAt: CONTENT_CREATED_AT,
        });
      }
    }
  }
}

function planTrainees(
  organizationId: string,
  trainees: PlannedTrainee[],
  now: Date,
  rows: StructureRows,
): Map<number, TraineeProfile> {
  const profiles = new Map<number, TraineeProfile>();
  for (const trainee of trainees) {
    const profile = traineeProfile(trainee);
    profiles.set(trainee.number, profile);
    if (!exists(trainee.firstEnrolledAt, now)) continue;

    if (profile.userId) {
      rows.users.push({
        id: profile.userId,
        email: profile.email,
        name: profile.name,
        emailVerifiedAt: trainee.firstEnrolledAt,
        createdAt: trainee.firstEnrolledAt,
        createdBy: SEED_SYSTEM_ACTOR,
      });
      rows.memberships.push({
        organizationId,
        userId: profile.userId,
        role: "student",
        createdAt: trainee.firstEnrolledAt,
      });
    }
    rows.trainees.push({
      id: trainee.id,
      organizationId,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      userId: profile.userId,
      createdAt: trainee.firstEnrolledAt,
      updatedAt: trainee.firstEnrolledAt,
      createdBy: SEED_SYSTEM_ACTOR,
    });
  }
  return profiles;
}

function planCohort(
  organizationId: string,
  cohort: Cohort,
  now: Date,
  rows: StructureRows,
) {
  if (!exists(cohort.createdAt, now)) return;
  const stamp = { createdAt: cohort.createdAt, updatedAt: cohort.createdAt };

  rows.groups.push({
    id: cohort.id,
    organizationId,
    name: cohort.name,
    courseId: cohort.course.id,
    teacherId: cohort.teacher.id,
    schedule: cohort.schedule,
    startDate: cohort.startDate,
    sessionCount: cohort.sessions.length,
    status: groupStatusAt(cohort, now),
    ...stamp,
  });
  for (const session of cohort.sessions) {
    rows.sessions.push({
      id: session.id,
      organizationId,
      groupId: cohort.id,
      scheduledAt: session.scheduledAt,
      plannedAt: session.scheduledAt,
      durationMinutes: session.durationMinutes,
      status: sessionStatusAt(session, now),
      teacherId: cohort.teacher.id,
      lectureId: session.lectureId,
      ...stamp,
    });
  }

  for (const seat of cohort.seats) {
    if (!exists(seat.enrolledAt, now)) continue;
    const traineeId = stableId(`trainee:${seat.traineeNumber}`);
    const enrolledStamp = {
      createdAt: seat.enrolledAt,
      updatedAt: seat.enrolledAt,
    };

    rows.enrollments.push({
      id: seat.enrollmentId,
      organizationId,
      traineeId,
      courseId: cohort.course.id,
      status: enrollmentStatusAt(cohort, seat, now),
      ...enrolledStamp,
    });

    if (seat.placementDoneAt) {
      const scheduledAt = addMinutes(seat.placementDoneAt, -45);
      const done = isOnRoster(seat, now);
      rows.placementTests.push({
        id: stableId(`placement:${seat.enrollmentId}`),
        organizationId,
        traineeId,
        formId: cohort.course.placementForm.id,
        assignedLevelId: done ? cohort.course.levels[0].id : null,
        status: done ? "completed" : "pending",
        feedback: done
          ? rngFor(`placement-feedback:${seat.enrollmentId}`).pick(
              PLACEMENT_FEEDBACK,
            )
          : null,
        scheduledAt,
        completedAt: done ? seat.placementDoneAt : null,
        ...enrolledStamp,
      });
    }

    if (!isOnRoster(seat, now)) continue;
    const rosterAt = seat.placementDoneAt ?? seat.enrolledAt;
    rows.groupStudents.push({
      id: stableId(`group-student:${cohort.index}:${seat.traineeNumber}`),
      organizationId,
      groupId: cohort.id,
      traineeId,
      createdAt: rosterAt,
    });
    for (const [levelIndex, level] of cohort.course.levels.entries()) {
      const progress = enrollmentLevelAt(cohort, seat, levelIndex, now);
      rows.enrollmentLevels.push({
        id: stableId(`enrollment-level:${seat.enrollmentId}:${levelIndex}`),
        organizationId,
        enrollmentId: seat.enrollmentId,
        levelId: level.id,
        status: progress.status,
        completedAt: progress.completedAt,
        createdAt: rosterAt,
        updatedAt: rosterAt,
      });
    }
  }
}

export function planStructure(input: {
  organizationId: string;
  now: Date;
  cohorts: Cohort[];
  trainees: PlannedTrainee[];
}): { rows: StructureRows; profiles: Map<number, TraineeProfile> } {
  const rows: StructureRows = {
    users: [],
    memberships: [],
    availability: [],
    groups: [],
    sessions: [],
    trainees: [],
    groupStudents: [],
    enrollments: [],
    enrollmentLevels: [],
    placementTests: [],
  };
  planStaff(input.organizationId, rows);
  const profiles = planTrainees(
    input.organizationId,
    input.trainees,
    input.now,
    rows,
  );
  for (const cohort of input.cohorts) {
    planCohort(input.organizationId, cohort, input.now, rows);
  }
  return { rows, profiles };
}
