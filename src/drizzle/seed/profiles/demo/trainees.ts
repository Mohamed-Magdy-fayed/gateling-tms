import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle";
import {
  CertificatesTable,
  EnrollmentLevelsTable,
  type EnrollmentStatus,
  EnrollmentsTable,
  GroupStudentsTable,
  type Session,
  SessionStudentsTable,
  type Trainee,
  TraineesTable,
} from "@/drizzle/schema";
import { seedIfMissing } from "../../base";
import type { DemoTraineeSeed } from "./data";

export async function seedDemoTrainee(
  organizationId: string,
  seed: DemoTraineeSeed,
): Promise<Trainee> {
  return seedIfMissing({
    label: `trainee "${seed.name}" (${seed.email})`,
    find: async () => {
      const [row] = await db
        .select()
        .from(TraineesTable)
        .where(
          and(
            eq(TraineesTable.organizationId, organizationId),
            eq(TraineesTable.email, seed.email),
          ),
        )
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(TraineesTable)
        .values({
          organizationId,
          name: seed.name,
          email: seed.email,
          phone: seed.phone,
          createdBy: "system:seed",
        })
        .returning();
      return row;
    },
  });
}

export async function seedDemoGroupStudent(
  organizationId: string,
  groupId: string,
  traineeId: string,
) {
  return seedIfMissing({
    label: `roster entry: trainee ${traineeId} in group ${groupId}`,
    find: async () => {
      const [row] = await db
        .select()
        .from(GroupStudentsTable)
        .where(
          and(
            eq(GroupStudentsTable.groupId, groupId),
            eq(GroupStudentsTable.traineeId, traineeId),
          ),
        )
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(GroupStudentsTable)
        .values({ organizationId, groupId, traineeId })
        .returning();
      return row;
    },
  });
}

export async function seedDemoEnrollment(input: {
  organizationId: string;
  traineeId: string;
  courseId: string;
  status: EnrollmentStatus;
}) {
  return seedIfMissing({
    label: `enrollment of trainee ${input.traineeId} in course ${input.courseId}`,
    find: async () => {
      const [row] = await db
        .select()
        .from(EnrollmentsTable)
        .where(
          and(
            eq(EnrollmentsTable.organizationId, input.organizationId),
            eq(EnrollmentsTable.traineeId, input.traineeId),
            eq(EnrollmentsTable.courseId, input.courseId),
          ),
        )
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(EnrollmentsTable)
        .values({
          organizationId: input.organizationId,
          traineeId: input.traineeId,
          courseId: input.courseId,
          status: input.status,
        })
        .returning();
      return row;
    },
  });
}

export async function seedDemoEnrollmentLevel(input: {
  organizationId: string;
  enrollmentId: string;
  levelId: string;
  status: "notStarted" | "inProgress" | "completed";
  completedAt?: Date;
}) {
  return seedIfMissing({
    label: `level progress for enrollment ${input.enrollmentId}, level ${input.levelId}`,
    find: async () => {
      const [row] = await db
        .select()
        .from(EnrollmentLevelsTable)
        .where(
          and(
            eq(EnrollmentLevelsTable.enrollmentId, input.enrollmentId),
            eq(EnrollmentLevelsTable.levelId, input.levelId),
          ),
        )
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(EnrollmentLevelsTable)
        .values({
          organizationId: input.organizationId,
          enrollmentId: input.enrollmentId,
          levelId: input.levelId,
          status: input.status,
          completedAt: input.completedAt,
        })
        .returning();
      return row;
    },
  });
}

export async function seedDemoCertificate(input: {
  organizationId: string;
  traineeId: string;
  courseId: string;
  groupId: string;
  title: string;
}) {
  return seedIfMissing({
    label: `certificate "${input.title}"`,
    find: async () => {
      const [row] = await db
        .select()
        .from(CertificatesTable)
        .where(
          and(
            eq(CertificatesTable.organizationId, input.organizationId),
            eq(CertificatesTable.traineeId, input.traineeId),
            eq(CertificatesTable.title, input.title),
          ),
        )
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(CertificatesTable)
        .values({
          organizationId: input.organizationId,
          traineeId: input.traineeId,
          courseId: input.courseId,
          groupId: input.groupId,
          title: input.title,
        })
        .returning();
      return row;
    },
  });
}

/**
 * Marks attendance for one already-happened session against one trainee.
 * `source` is always "manual" — which is now the only source there is
 * (STATE.md D144): onMeeting publishes no webhooks, so nothing observes who
 * was in the room and the register is what the teacher says it is.
 */
export async function seedDemoAttendance(input: {
  organizationId: string;
  session: Session;
  traineeId: string;
  present: boolean;
  markedBy: string;
}) {
  return seedIfMissing({
    label: `attendance of trainee ${input.traineeId} for session ${input.session.id}`,
    find: async () => {
      const [row] = await db
        .select()
        .from(SessionStudentsTable)
        .where(
          and(
            eq(SessionStudentsTable.sessionId, input.session.id),
            eq(SessionStudentsTable.traineeId, input.traineeId),
          ),
        )
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(SessionStudentsTable)
        .values({
          organizationId: input.organizationId,
          sessionId: input.session.id,
          traineeId: input.traineeId,
          status: input.present ? "present" : "absent",
          source: "manual",
          // No join/leave stamps and no attended minutes: nothing in the app
          // produces them any more (D144), so seeding them would put demo data
          // on screen that no real flow can reach. The columns stay for rows
          // recorded before the provider change.
          markedBy: input.markedBy,
        })
        .returning();
      return row;
    },
  });
}
