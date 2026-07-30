import { eq } from "drizzle-orm";
import { db } from "@/drizzle";
import { OrganizationsTable } from "@/drizzle/schema";
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
  SEED_TEACHER_EMAIL,
  SEED_TEACHER_ID,
} from "../constants";
import { seedMember } from "../lib/seed-member";

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
