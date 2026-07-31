import { eq } from "drizzle-orm";
import { db } from "@/drizzle";
import { OrganizationsTable, TestimonialsTable } from "@/drizzle/schema";
import { seedIfMissing } from "../../base";
import { SEED_ADMIN_ID, SEED_SYSTEM_ACTOR } from "../../constants";

/**
 * The demo org's published testimonial, plus its consent to be named in the
 * landing page's showcase band.
 *
 * Seeded in the fully-published state (`isPublic` **and** `approvedAt` set) on
 * purpose: the demo dataset exists so every landing-page claim is demoable, and
 * "real academies say this" is one of them. It is fixture text written by us,
 * not a real customer quote — the difference from the placeholder this replaced
 * is that the production page now renders whatever the database actually holds,
 * so an empty database shows nothing rather than an invented endorsement.
 */
export async function seedDemoTestimonial(organizationId: string) {
  await db
    .update(OrganizationsTable)
    .set({ publicShowcaseConsentAt: new Date("2026-06-01T09:00:00Z") })
    .where(eq(OrganizationsTable.id, organizationId));

  return seedIfMissing({
    label: `demo testimonial for org ${organizationId}`,
    find: async () => {
      const [row] = await db
        .select()
        .from(TestimonialsTable)
        .where(eq(TestimonialsTable.organizationId, organizationId))
        .limit(1);
      return row;
    },
    insert: async () => {
      const [row] = await db
        .insert(TestimonialsTable)
        .values({
          organizationId,
          authorUserId: SEED_ADMIN_ID,
          quote:
            "We moved the whole academy over in a weekend. Schedules, attendance and certificates all live in one place now, and I stopped rebuilding the same spreadsheet every term.",
          authorName: "Demo Admin",
          authorRole: "Founder",
          isPublic: true,
          approvedAt: new Date("2026-06-02T09:00:00Z"),
          createdBy: SEED_SYSTEM_ACTOR,
        })
        .returning();
      return row;
    },
  });
}
