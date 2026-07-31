import { expect, test } from "@playwright/test";
import {
  SEED_ADMIN_EMAIL,
  SEED_DEFAULT_PASSWORD,
} from "@/drizzle/seed/constants";

/**
 * "sessions (onMeeting mocked/fixtures)" — verifies the UI shows a working
 * host link for a session seeded as already started, entirely from fixture
 * data (docs/seeding-and-demo-data.md's "onMeeting fixture data" section).
 * No real onMeeting account is ever contacted, here or in the app itself:
 * the seed wrote the meeting fields straight onto the session row, which is
 * the state a real session reaches only after a host presses "Start class"
 * (STATE.md D143).
 *
 * Signed in as the org admin, who has host rights on the seeded group —
 * `SessionJoinActions` shows the host link for that role, not the
 * participant-facing "Join" a student would see.
 */
test("an onMeeting-fixture-connected session shows a working host link", async ({
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

  // The fixture-connected group's sessions start 2026-06-01 — in the past
  // relative to any real run — so they only show under "Past", not the
  // default "Upcoming" scope.
  await page.getByRole("button", { name: "Past" }).click();

  // A link, not the button: a started session hands out its stored host URL
  // rather than offering to create a meeting.
  const startLink = page.getByRole("link", { name: "Start class" }).first();
  await expect(startLink).toBeVisible();
  await expect(startLink).toHaveAttribute("href", /onmeeting\.co\/s\//);
  await expect(startLink).toHaveAttribute("target", "_blank");
});
