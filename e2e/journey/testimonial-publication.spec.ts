import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { OrganizationsTable, TestimonialsTable } from "@/drizzle/schema";
import { db } from "../lib/db";

/**
 * The publication gate, proved against the real database rather than asserted
 * in a comment.
 *
 * Two conditions must both hold before a quote reaches a visitor: the author
 * consented (`isPublic`) and Gateling approved it (`approvedAt`). This walks
 * each half of that: the `demo` profile's fully-published quote must be on the
 * page, and three deliberately-unpublishable rows must not be — consented but
 * unapproved, approved but consent withdrawn, and neither.
 *
 * Each case needs its own organization because `testimonials` is unique per
 * org; they are created and torn down here rather than seeded, so the profile
 * stays the clean demo dataset.
 */
const CASES = [
  {
    shortCode: "E2T1",
    name: "E2E Pending Academy",
    quote: "E2E pending quote — consented but never approved.",
    isPublic: true,
    approvedAt: null,
  },
  {
    shortCode: "E2T2",
    name: "E2E Withdrawn Academy",
    quote: "E2E withdrawn quote — approved, then consent withdrawn.",
    isPublic: false,
    approvedAt: new Date("2026-06-02T09:00:00Z"),
  },
  {
    shortCode: "E2T3",
    name: "E2E Draft Academy",
    quote: "E2E draft quote — neither consented nor approved.",
    isPublic: false,
    approvedAt: null,
  },
];

const createdOrganizationIds: string[] = [];

test.beforeAll(async () => {
  for (const testCase of CASES) {
    const [organization] = await db
      .insert(OrganizationsTable)
      .values({ shortCode: testCase.shortCode, name: testCase.name })
      .returning({ id: OrganizationsTable.id });

    createdOrganizationIds.push(organization.id);

    await db.insert(TestimonialsTable).values({
      organizationId: organization.id,
      quote: testCase.quote,
      authorName: "E2E Author",
      isPublic: testCase.isPublic,
      approvedAt: testCase.approvedAt,
      createdBy: "e2e",
    });
  }
});

test.afterAll(async () => {
  for (const organizationId of createdOrganizationIds) {
    // The testimonial goes with it — the FK cascades.
    await db
      .delete(OrganizationsTable)
      .where(eq(OrganizationsTable.id, organizationId));
  }
});

test("only consented and approved feedback reaches the public pages", async ({
  page,
}) => {
  await page.goto("/testimonials");

  await expect(
    page.getByText("We moved the whole academy over in a weekend", {
      exact: false,
    }),
  ).toBeVisible();

  for (const testCase of CASES) {
    await expect(page.getByText(testCase.quote)).toHaveCount(0);
  }

  // The home page renders the same data through a different component, so it
  // gets the same check rather than being assumed to follow.
  await page.goto("/");
  for (const testCase of CASES) {
    await expect(page.getByText(testCase.quote)).toHaveCount(0);
  }
});
