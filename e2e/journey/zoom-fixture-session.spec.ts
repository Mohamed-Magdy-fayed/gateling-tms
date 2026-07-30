import { expect, test } from "@playwright/test";
import {
  SEED_ADMIN_EMAIL,
  SEED_DEFAULT_PASSWORD,
} from "@/drizzle/seed/constants";

/**
 * "sessions (Zoom mocked/fixtures)" — verifies the UI shows a working
 * meeting link for a session that was seeded as Zoom-connected, entirely
 * from fixture data (docs/seeding-and-demo-data.md's "Zoom fixture data"
 * section). No real Zoom account is ever contacted, here or in the app
 * itself — the seed wrote the meeting fields straight onto the session row.
 *
 * Signed in as the org admin, who has host rights on the seeded group's
 * teacher-or-admin start link — `SessionJoinActions` shows "Start class"
 * (zoomStartUrl) for that role, not the participant-facing "Join"
 * (zoomJoinUrl) a student would see.
 */
test("a Zoom-fixture-connected session shows a working Start class link", async ({
  page,
}) => {
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email").fill(SEED_ADMIN_EMAIL);
  await page.getByRole("button", { name: "Continue" }).click();
  await page
    .getByLabel("Password", { exact: true })
    .fill(SEED_DEFAULT_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/dashboard");

  await page.goto("/live-classes/sessions");
  await expect(
    page.getByRole("heading", { name: "Live classes" }),
  ).toBeVisible();

  // The Zoom-fixture-connected group's sessions start 2026-06-01 — in the
  // past relative to any real run — so they only show under "Past", not the
  // default "Upcoming" scope.
  await page.getByRole("button", { name: "Past" }).click();

  const startLink = page.getByRole("link", { name: "Start class" }).first();
  await expect(startLink).toBeVisible();
  await expect(startLink).toHaveAttribute("href", /zoom\.us\/s\//);
  await expect(startLink).toHaveAttribute("target", "_blank");
});
