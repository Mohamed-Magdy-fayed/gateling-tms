import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle";
import {
  type OrganizationMembershipRole,
  OrganizationMembershipsTable,
  OrganizationsTable,
  UserCredentialsTable,
  UsersTable,
} from "@/drizzle/schema";
import { generateSalt, hashPassword } from "@/features/core/auth/core/passwordHasher";
import { seedIfMissing } from "../base";
import {
  SEED_ADMIN_EMAIL,
  SEED_ADMIN_ID,
  SEED_DEFAULT_PASSWORD,
  SEED_ORG_ID,
  SEED_ORG_NAME,
  SEED_ORG_SHORT_CODE,
  SEED_STUDENT_1_EMAIL,
  SEED_STUDENT_1_ID,
  SEED_STUDENT_2_EMAIL,
  SEED_STUDENT_2_ID,
  SEED_SYSTEM_ACTOR,
  SEED_TEACHER_EMAIL,
  SEED_TEACHER_ID,
} from "../constants";

async function seedMember({
  id,
  email,
  name,
  organizationId,
  role,
}: {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  role: OrganizationMembershipRole;
}) {
  const user = await seedIfMissing({
    label: `${role} user ${email}`,
    find: async () => {
      const [row] = await db
        .select()
        .from(UsersTable)
        .where(eq(UsersTable.email, email))
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(UsersTable)
        .values({
          id,
          email,
          name,
          emailVerifiedAt: new Date(),
          createdBy: SEED_SYSTEM_ACTOR,
        })
        .returning();
      return row;
    },
  });

  await seedIfMissing({
    label: `credentials for ${email}`,
    find: async () => {
      const [row] = await db
        .select()
        .from(UserCredentialsTable)
        .where(eq(UserCredentialsTable.userId, user.id))
        .limit(1);
      return row;
    },
    insert: async () => {
      const salt = generateSalt();
      const passwordHash = await hashPassword(SEED_DEFAULT_PASSWORD, salt);
      const [row] = await db
        .insert(UserCredentialsTable)
        .values({
          userId: user.id,
          passwordHash,
          passwordSalt: salt,
        })
        .returning();
      return row;
    },
  });

  await seedIfMissing({
    label: `membership of ${email} in org ${organizationId} as ${role}`,
    find: async () => {
      const [row] = await db
        .select()
        .from(OrganizationMembershipsTable)
        .where(
          and(
            eq(OrganizationMembershipsTable.organizationId, organizationId),
            eq(OrganizationMembershipsTable.userId, user.id),
          ),
        )
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(OrganizationMembershipsTable)
        .values({ organizationId, userId: user.id, role })
        .returning();
      return row;
    },
  });

  return user;
}

/**
 * Dev bootstrap: one organization, one admin, one teacher, two students —
 * all signed in with the same known dev password (`SEED_DEFAULT_PASSWORD`,
 * documented in README.md). Additive-only and idempotent — each record is
 * looked up by a stable natural key (org short code, user email) and only
 * inserted if missing. Existing rows are never updated or deleted, so
 * running this profile twice in a row is a no-op the second time.
 */
export async function seedBaselineProfile() {
  const organization = await seedIfMissing({
    label: `organization "${SEED_ORG_NAME}" (short code ${SEED_ORG_SHORT_CODE})`,
    find: async () => {
      const [row] = await db
        .select()
        .from(OrganizationsTable)
        .where(eq(OrganizationsTable.shortCode, SEED_ORG_SHORT_CODE))
        .limit(1);
      return row;
    },
    insert: async () => {
      // `ownerId` is left unset here (nullable column) rather than pointed
      // at SEED_ADMIN_ID — the admin user row doesn't exist yet at this
      // point in the seed (seedMember for the admin runs next), and
      // ownerId's FK would fail against a not-yet-inserted row.
      const [row] = await db
        .insert(OrganizationsTable)
        .values({
          id: SEED_ORG_ID,
          shortCode: SEED_ORG_SHORT_CODE,
          name: SEED_ORG_NAME,
          plan: "free",
        })
        .returning();
      return row;
    },
  });

  await seedMember({
    id: SEED_ADMIN_ID,
    email: SEED_ADMIN_EMAIL,
    name: "Gateling-TMS Admin",
    organizationId: organization.id,
    role: "admin",
  });

  await seedMember({
    id: SEED_TEACHER_ID,
    email: SEED_TEACHER_EMAIL,
    name: "Gateling-TMS Teacher",
    organizationId: organization.id,
    role: "teacher",
  });

  await seedMember({
    id: SEED_STUDENT_1_ID,
    email: SEED_STUDENT_1_EMAIL,
    name: "Gateling-TMS Student One",
    organizationId: organization.id,
    role: "student",
  });

  await seedMember({
    id: SEED_STUDENT_2_ID,
    email: SEED_STUDENT_2_EMAIL,
    name: "Gateling-TMS Student Two",
    organizationId: organization.id,
    role: "student",
  });

  console.info(
    'Baseline profile ready: organization "%s" (%s) with admin/teacher/2 students, all password "%s".',
    organization.name,
    SEED_ORG_SHORT_CODE,
    SEED_DEFAULT_PASSWORD,
  );

  return { profile: "baseline" as const };
}
