import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle";
import {
  CoursesTable,
  OrganizationsTable,
  TraineesTable,
} from "@/drizzle/schema";
import { countOrganizationUsage } from "@/features/core/organizations/server/usage";
import { seedIfMissing } from "../base";
import {
  SEED_PERFORMANCE_ADMIN_EMAIL,
  SEED_PERFORMANCE_ADMIN_ID,
  SEED_PERFORMANCE_ORG_ID,
  SEED_PERFORMANCE_ORG_NAME,
  SEED_PERFORMANCE_ORG_SHORT_CODE,
  SEED_SYSTEM_ACTOR,
} from "../constants";
import { seedMember } from "../lib/seed-member";

const PERFORMANCE_COURSE_NAMES = [
  "Course 01 — Volume Track",
  "Course 02 — Volume Track",
  "Course 03 — Volume Track",
  "Course 04 — Volume Track",
  "Course 05 — Volume Track",
];

const PERFORMANCE_STUDENT_COUNT = 50;

/**
 * Near-limit volumes on their own organization: exactly the Free-plan caps
 * (`00-product-spec.md`: 50 students / 5 courses), so the usage-visibility
 * UI (`PlanUsageCard`/`PlanLimitNotice`, Phase 8 segment ①) actually renders
 * in its at-cap state. Deliberately just courses + trainees — no
 * levels/lectures/groups/enrollments — the point is table/query volume and
 * the limit UI, not a second realistic-academy dataset (that's `demo`).
 *
 * Its own organization rather than piling onto `demo`'s — see
 * constants.ts's SEED_PERFORMANCE_ORG_ID comment for why.
 */
export async function seedPerformanceProfile() {
  const organization = await seedIfMissing({
    label: `organization "${SEED_PERFORMANCE_ORG_NAME}" (short code ${SEED_PERFORMANCE_ORG_SHORT_CODE})`,
    find: async () => {
      const [row] = await db
        .select()
        .from(OrganizationsTable)
        .where(
          eq(OrganizationsTable.shortCode, SEED_PERFORMANCE_ORG_SHORT_CODE),
        )
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(OrganizationsTable)
        .values({
          id: SEED_PERFORMANCE_ORG_ID,
          shortCode: SEED_PERFORMANCE_ORG_SHORT_CODE,
          name: SEED_PERFORMANCE_ORG_NAME,
          plan: "free",
        })
        .returning();
      return row;
    },
  });

  await seedMember({
    id: SEED_PERFORMANCE_ADMIN_ID,
    email: SEED_PERFORMANCE_ADMIN_EMAIL,
    name: "Gateling-TMS Performance Admin",
    organizationId: organization.id,
    role: "admin",
  });

  for (const name of PERFORMANCE_COURSE_NAMES) {
    await seedIfMissing({
      label: `course "${name}"`,
      find: async () => {
        const [row] = await db
          .select()
          .from(CoursesTable)
          .where(
            and(
              eq(CoursesTable.organizationId, organization.id),
              eq(CoursesTable.name, name),
            ),
          )
          .limit(1);
        return row;
      },
      insert: async () => {
        const [row] = await db
          .insert(CoursesTable)
          .values({
            organizationId: organization.id,
            name,
            createdBy: SEED_SYSTEM_ACTOR,
          })
          .returning();
        return row;
      },
    });
  }

  for (let index = 1; index <= PERFORMANCE_STUDENT_COUNT; index += 1) {
    const paddedIndex = String(index).padStart(3, "0");
    const email = `perf-student-${paddedIndex}@gateling-tms.dev`;
    await seedIfMissing({
      label: `trainee ${email}`,
      find: async () => {
        const [row] = await db
          .select()
          .from(TraineesTable)
          .where(
            and(
              eq(TraineesTable.organizationId, organization.id),
              eq(TraineesTable.email, email),
            ),
          )
          .limit(1);
        return row;
      },
      insert: async () => {
        const [row] = await db
          .insert(TraineesTable)
          .values({
            organizationId: organization.id,
            name: `Performance Student ${paddedIndex}`,
            email,
            createdBy: SEED_SYSTEM_ACTOR,
          })
          .returning();
        return row;
      },
    });
  }

  const usage = await countOrganizationUsage(db, organization.id);
  await db
    .update(OrganizationsTable)
    .set(usage)
    .where(eq(OrganizationsTable.id, organization.id));

  console.info(
    'Performance profile ready: organization "%s" (%s) at %d students / %d courses.',
    organization.name,
    SEED_PERFORMANCE_ORG_SHORT_CODE,
    usage.studentCount,
    usage.courseCount,
  );

  return { profile: "performance" as const };
}
