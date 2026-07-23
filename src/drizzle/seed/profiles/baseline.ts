import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle";
import {
  OrganizationMembershipsTable,
  OrganizationsTable,
  UserCredentialsTable,
  UsersTable,
} from "@/drizzle/schema";
import { seedIfMissing } from "../base";
import {
  SEED_ADMIN_EMAIL,
  SEED_ADMIN_ID,
  SEED_ORG_ID,
  SEED_ORG_NAME,
  SEED_ORG_SHORT_CODE,
  SEED_SYSTEM_ACTOR,
} from "../constants";

/**
 * NOT a real password hash — real hashing (argon2/bcrypt) is wired up in
 * Phase 2 alongside the auth feature. This placeholder exists only so the
 * `user_credentials` row satisfies its NOT NULL columns; it can never
 * authenticate anything until Phase 2 replaces it.
 */
const PLACEHOLDER_PASSWORD_HASH = "UNSET_PENDING_PHASE_2_AUTH";
const PLACEHOLDER_PASSWORD_SALT = "UNSET_PENDING_PHASE_2_AUTH";

/**
 * Minimal dev bootstrap: one organization + one admin user + the membership
 * linking them. Additive-only and idempotent — each record is looked up by
 * a stable natural key (org short code, user email) and only inserted if
 * missing. Existing rows are never updated or deleted, so running this
 * profile twice in a row is a no-op the second time.
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

  const adminUser = await seedIfMissing({
    label: `admin user ${SEED_ADMIN_EMAIL}`,
    find: async () => {
      const [row] = await db
        .select()
        .from(UsersTable)
        .where(eq(UsersTable.email, SEED_ADMIN_EMAIL))
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(UsersTable)
        .values({
          id: SEED_ADMIN_ID,
          email: SEED_ADMIN_EMAIL,
          name: "Gateling-TMS Admin",
          emailVerifiedAt: new Date(),
          createdBy: SEED_SYSTEM_ACTOR,
        })
        .returning();
      return row;
    },
  });

  await seedIfMissing({
    label: `credentials placeholder for ${SEED_ADMIN_EMAIL}`,
    find: async () => {
      const [row] = await db
        .select()
        .from(UserCredentialsTable)
        .where(eq(UserCredentialsTable.userId, adminUser.id))
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(UserCredentialsTable)
        .values({
          userId: adminUser.id,
          passwordHash: PLACEHOLDER_PASSWORD_HASH,
          passwordSalt: PLACEHOLDER_PASSWORD_SALT,
          mustChangePassword: true,
        })
        .returning();
      return row;
    },
  });

  await seedIfMissing({
    label: `membership of ${SEED_ADMIN_EMAIL} in "${organization.name}"`,
    find: async () => {
      const [row] = await db
        .select()
        .from(OrganizationMembershipsTable)
        .where(
          and(
            eq(OrganizationMembershipsTable.organizationId, organization.id),
            eq(OrganizationMembershipsTable.userId, adminUser.id),
          ),
        )
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(OrganizationMembershipsTable)
        .values({
          organizationId: organization.id,
          userId: adminUser.id,
          role: "admin",
        })
        .returning();
      return row;
    },
  });

  console.info(
    'Baseline profile ready: organization "%s" (%s), admin user %s.',
    organization.name,
    SEED_ORG_SHORT_CODE,
    SEED_ADMIN_EMAIL,
  );

  return { profile: "baseline" as const };
}
