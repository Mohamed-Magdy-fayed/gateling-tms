import { eq } from "drizzle-orm";
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
  OrganizationMembershipsTable,
  OrganizationsTable,
  PaymentsTable,
  PlacementTestsTable,
  QuestionsTable,
  SessionStudentsTable,
  SessionsTable,
  TeacherAvailabilityTable,
  TraineeNotesTable,
  TraineesTable,
  UsersTable,
} from "@/drizzle/schema";
import { countOrganizationUsage } from "@/features/core/organizations/server/usage";
import {
  SEED_SHOWCASE_ADMIN_EMAIL,
  SEED_SHOWCASE_ADMIN_NAME,
  SEED_SHOWCASE_ORG_ID,
  SEED_SHOWCASE_ORG_NAME,
  SEED_SHOWCASE_ORG_SHORT_CODE,
  SEED_SYSTEM_ACTOR,
} from "../../constants";
import { CONTENT_CREATED_AT } from "./content";
import { stableId } from "./determinism";
import { showcaseSeedDecision } from "./guard";
import { planShowcase } from "./plan";
import { advanceUntouched, insertMissing } from "./write";

const TIME_ZONE = "Africa/Cairo";

/**
 * The showcase admin is a real person who signs in with Google. Google sign-in
 * links to an existing user by email, so if the account isn't in this database
 * yet, a password-less user row is all it takes for the first sign-in to land
 * in it.
 */
async function ensureAdmin(): Promise<string> {
  const [existing] = await db
    .select({ id: UsersTable.id })
    .from(UsersTable)
    .where(eq(UsersTable.email, SEED_SHOWCASE_ADMIN_EMAIL))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(UsersTable)
    .values({
      id: stableId("showcase-admin"),
      email: SEED_SHOWCASE_ADMIN_EMAIL,
      name: SEED_SHOWCASE_ADMIN_NAME,
      emailVerifiedAt: new Date(),
      createdBy: SEED_SYSTEM_ACTOR,
    })
    .returning({ id: UsersTable.id });
  return created.id;
}

async function ensureOrganization(adminId: string) {
  await db
    .insert(OrganizationsTable)
    .values({
      id: SEED_SHOWCASE_ORG_ID,
      shortCode: SEED_SHOWCASE_ORG_SHORT_CODE,
      name: SEED_SHOWCASE_ORG_NAME,
      businessName: "Horizon Language Academy LLC",
      plan: "enterprise",
      planGrantedBy: SEED_SYSTEM_ACTOR,
      planGrantedAt: CONTENT_CREATED_AT,
      timeZone: TIME_ZONE,
      currency: "EGP",
      ownerId: adminId,
      createdAt: CONTENT_CREATED_AT,
    })
    .onConflictDoNothing();

  const [organization] = await db
    .select({ id: OrganizationsTable.id })
    .from(OrganizationsTable)
    .where(eq(OrganizationsTable.id, SEED_SHOWCASE_ORG_ID))
    .limit(1);
  if (!organization) {
    throw new Error(
      `Showcase organization could not be created: short code "${SEED_SHOWCASE_ORG_SHORT_CODE}" is already taken by another organization.`,
    );
  }

  await db
    .insert(OrganizationMembershipsTable)
    .values({
      organizationId: SEED_SHOWCASE_ORG_ID,
      userId: adminId,
      role: "admin",
    })
    .onConflictDoNothing();
}

/**
 * Two years of a busy language academy, for sales demos on preview. Safe to
 * run on every build: it only adds what is missing and moves untouched rows
 * forward in time — see docs/seeding-and-demo-data.md.
 */
export async function seedShowcaseProfile() {
  const decision = showcaseSeedDecision(process.env);
  if (!decision.allowed) {
    console.info(
      `showcase: skipped — runs only on preview (${decision.reason}).`,
    );
    return { profile: "showcase" as const };
  }

  // SEED_NOW pretends the build ran at another moment — for checking locally
  // what a later build adds. Unset everywhere else.
  const now = process.env.SEED_NOW
    ? new Date(process.env.SEED_NOW)
    : new Date();
  if (Number.isNaN(now.getTime()))
    throw new Error("SEED_NOW is not a valid date.");
  const adminId = await ensureAdmin();
  await ensureOrganization(adminId);

  const plan = planShowcase({
    organizationId: SEED_SHOWCASE_ORG_ID,
    timeZone: TIME_ZONE,
    now,
  });
  const { content, structure, activity } = plan;

  // Parents before children, so every foreign key already resolves.
  await insertMissing(UsersTable, structure.users, "users");
  await insertMissing(
    OrganizationMembershipsTable,
    structure.memberships,
    "memberships",
  );
  await insertMissing(
    TeacherAvailabilityTable,
    structure.availability,
    "teacher availability",
  );
  await insertMissing(CoursesTable, content.courses, "courses");
  await insertMissing(LevelsTable, content.levels, "levels");
  await insertMissing(LecturesTable, content.lectures, "lectures");
  await insertMissing(FormsTable, content.forms, "forms");
  await insertMissing(FormSectionsTable, content.sections, "form sections");
  await insertMissing(QuestionsTable, content.questions, "questions");
  await insertMissing(AnswersTable, content.answers, "answers");
  await insertMissing(GroupsTable, structure.groups, "groups");
  await insertMissing(SessionsTable, structure.sessions, "sessions");
  await insertMissing(TraineesTable, structure.trainees, "trainees");
  await insertMissing(
    GroupStudentsTable,
    structure.groupStudents,
    "group rosters",
  );
  await insertMissing(EnrollmentsTable, structure.enrollments, "enrollments");
  await insertMissing(
    EnrollmentLevelsTable,
    structure.enrollmentLevels,
    "level progress",
  );
  await insertMissing(
    PlacementTestsTable,
    structure.placementTests,
    "placement tests",
  );
  await insertMissing(PaymentsTable, activity.payments, "payments");
  await insertMissing(SessionStudentsTable, activity.attendance, "attendance");
  await insertMissing(CertificatesTable, activity.certificates, "certificates");
  await insertMissing(FormResponsesTable, activity.responses, "form responses");
  await insertMissing(TraineeNotesTable, activity.notes, "notes");

  await advanceUntouched(GroupsTable, structure.groups, ["status"], "groups");
  await advanceUntouched(
    SessionsTable,
    structure.sessions,
    ["status"],
    "sessions",
  );
  await advanceUntouched(
    EnrollmentsTable,
    structure.enrollments,
    ["status"],
    "enrollments",
  );
  await advanceUntouched(
    EnrollmentLevelsTable,
    structure.enrollmentLevels,
    ["status", "completedAt"],
    "level progress",
  );
  await advanceUntouched(
    PlacementTestsTable,
    structure.placementTests,
    ["status", "completedAt", "assignedLevelId", "feedback"],
    "placement tests",
  );

  const usage = await countOrganizationUsage(db, SEED_SHOWCASE_ORG_ID);
  await db
    .update(OrganizationsTable)
    .set(usage)
    .where(eq(OrganizationsTable.id, SEED_SHOWCASE_ORG_ID));

  console.info(
    "Showcase ready: %d cohorts, %d trainees, %d classes, %d attendance records.",
    plan.cohortCount,
    structure.trainees.length,
    structure.sessions.length,
    activity.attendance.length,
  );
  return { profile: "showcase" as const };
}
