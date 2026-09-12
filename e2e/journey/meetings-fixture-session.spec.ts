import { expect, test } from "@playwright/test";
import {
  SEED_ADMIN_EMAIL,
  SEED_DEFAULT_PASSWORD,
  SEED_TEACHER_EMAIL,
} from "@/drizzle/seed/constants";

/**
 * "sessions (Gateling Meetings fixtures)" — verifies the UI shows the right
 * join action for a session seeded as already started, entirely from fixture
 * data (docs/seeding-and-demo-data.md's "meeting fixture data" section). No
 * real Meetings deployment is ever contacted, here or in the app itself: the
 * seed wrote the meeting fields straight onto the session row, which is the
 * state a real session reaches only after a host presses "Start class"
 * (STATE.md D143). The links are never followed — following one would ask
 * Meetings for a signed URL, and nothing in CI can answer.
 *
 * Two members, two states: the seeded host (the teacher) gets "Start class",
 * an admin who didn't start it gets "Join" — both pointing at the in-app
 * `/join` route rather than at any meeting URL.
 */
async function signIn(
  page: import("@playwright/test").Page,
  email: string,
): Promise<void> {
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Continue" }).click();
  await page
    .getByLabel("Password", { exact: true })
    .fill(SEED_DEFAULT_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/dashboard");
}

async function openPastAgenda(
  page: import("@playwright/test").Page,
): Promise<void> {
  await page.goto("/live-classes/sessions");
  await expect(
    page.getByRole("heading", { name: "Live classes" }),
  ).toBeVisible();

  // The fixture group's sessions start 2026-06-01 — in the past relative to
  // any real run — so they only show under "Past", not the default scope.
  await page.getByRole("button", { name: "Past" }).click();
}

const JOIN_ROUTE = /\/live-classes\/sessions\/[0-9a-f-]{36}\/join$/;

test("the seeded host sees a host link into the in-app join route", async ({
  page,
}) => {
  await signIn(page, SEED_TEACHER_EMAIL);
  await openPastAgenda(page);

  // A link, not the button: a started session offers its room rather than
  // offering to create one.
  const startLink = page.getByRole("link", { name: "Start class" }).first();
  await expect(startLink).toBeVisible();
  await expect(startLink).toHaveAttribute("href", JOIN_ROUTE);
  await expect(startLink).toHaveAttribute("target", "_blank");
});

test("an admin who didn't start the class joins it as a participant", async ({
  page,
}) => {
  await signIn(page, SEED_ADMIN_EMAIL);
  await openPastAgenda(page);

  const joinLink = page.getByRole("link", { name: "Join" }).first();
  await expect(joinLink).toBeVisible();
  await expect(joinLink).toHaveAttribute("href", JOIN_ROUTE);
});
