import { expect, test } from "@playwright/test";
import { closeDbConnection } from "../lib/db";
import { issueDevEmailVerificationToken } from "../lib/dev-token";
import {
  buildOversizedTraineesImportFixture,
  buildTraineesImportFixture,
} from "../lib/import-fixture";

/**
 * The 00-product-spec.md acceptance script end to end, steps 1-11, as one
 * continuous run against a brand-new organization created by a real signup
 * — not the seeded `demo` org, so the "zero-master-data" claim in step 5 is
 * actually being tested against an org that starts with nothing.
 *
 * One `test()` with `test.step()`s, not several `test()`s: every step
 * depends on state the previous one created (the signed-up account, the
 * created group, the imported trainees), and Playwright doesn't share a
 * `page` across separate `test()` blocks without extra wiring that would
 * only exist to route around that split.
 */
test("the full product journey: signup through hitting the free-plan limit", async ({
  page,
}) => {
  test.setTimeout(180_000);

  const runId = Date.now().toString(36);
  const adminEmail = `e2e-admin-${runId}@example.com`;
  // `users.phone` is unique — a fixed literal would collide with itself on
  // a second run against the same database.
  const adminPhone = `+201${Date.now().toString().slice(-9)}`;
  const adminPassword = "E2eJourney123!";
  const groupName = `E2E Journey Group ${runId}`;
  const courseName = `E2E Enrichment Course ${runId}`;
  const placementFormTitle = `E2E Placement ${runId}`;

  await test.step("1. Discover — landing page offers Get Started Free", async () => {
    await page.goto("/");
    await page.getByRole("link", { name: "Get Started Free" }).first().click();
    await page.waitForURL("**/get-started");
  });

  await test.step("2. Sign up — the get-started wizard", async () => {
    await page.getByLabel("Your name").fill("E2E Admin");
    await page.getByLabel("Business name").fill(`E2E Academy ${runId}`);
    await page.getByLabel("Email").fill(adminEmail);
    await page.getByLabel("Phone number").fill(adminPhone);
    await page.getByLabel("Password", { exact: true }).fill(adminPassword);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText("Review and submit")).toBeVisible();
    await page.getByRole("button", { name: "Let's go" }).click();
    await page.waitForURL("**/auth/verify-email");
  });

  await test.step("3. Verify email — dev-mode token capture, skip passkey setup", async () => {
    const token = await issueDevEmailVerificationToken(adminEmail);
    await page.goto(`/auth/verify-email?token=${token}`);
    await expect(page.getByText("Your email has been verified.")).toBeVisible();
    await page.getByRole("link", { name: "Skip, go to dashboard" }).click();
    await page.waitForURL("**/dashboard");
  });

  await test.step("4. Org created — lands on the dashboard as the org's admin", async () => {
    await expect(
      page.getByRole("heading", { level: 1, name: /Welcome back/ }),
    ).toBeVisible();
  });

  let groupUrl = "";

  await test.step("5a. First class in minutes — create a group with no course attached", async () => {
    await page.goto("/learning-flow/groups");
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Add group" }),
    ).toBeVisible();

    // Course field is left at its default ("No course") — this is the
    // zero-master-data assertion: the form submits fine with no catalog
    // entry selected.
    await page.getByLabel("Name").fill(groupName);
    await page.getByRole("button", { name: "Add a slot" }).click();
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page.getByText("Group created.")).toBeVisible();

    await page.getByRole("link", { name: groupName }).click();
    await page.waitForURL("**/learning-flow/groups/**");
    groupUrl = page.url();
  });

  await test.step("5a-ii. The weekly slot actually produces sessions", async () => {
    // The gap that let a broken generation pipeline ship: every earlier check
    // stopped at "the group saved". A slot the user can see and no sessions
    // underneath it is the failure this asserts against — the card polls, so
    // give it longer than a normal assertion before calling it stuck.
    // "120 min" is the session rows' duration line, and nothing else on a
    // group's page renders it.
    await expect(page.getByText(/^\d+ min$/).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByText("Sessions haven't been generated"),
    ).toBeHidden();
  });

  await test.step("5b. Add students — import from an Excel template", async () => {
    await page.goto("/learning-flow/trainees");
    await page.getByRole("button", { name: "Import", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Import from a spreadsheet" }),
    ).toBeVisible();

    const fixturePath = await buildTraineesImportFixture();
    await page.locator('input[type="file"]').setInputFiles(fixturePath);

    await expect(page.getByText(/8 rows? ready/)).toBeVisible();
    await expect(page.getByText(/2 rows? skipped/)).toBeVisible();

    await page.getByRole("button", { name: /Import \d+ row/ }).click();
    await expect(page.getByText(/Imported \d+ new/)).toBeVisible();
  });

  await test.step("5c. Assign — add the imported students to the group", async () => {
    await page.goto(groupUrl);
    await page.getByRole("button", { name: "Add students" }).first().click();
    await expect(
      page.getByRole("heading", { name: "Add students" }),
    ).toBeVisible();

    await page.getByPlaceholder("Search trainees…").fill("Fatma");
    await page.getByRole("button", { name: /Fatma Rageh/ }).click();
    await page.getByPlaceholder("Search trainees…").fill("Ibrahim");
    await page.getByRole("button", { name: /Ibrahim Naguib/ }).click();

    await page.getByRole("button", { name: /2 selected/ }).click();
    await expect(page.getByText("Students added.")).toBeVisible();
  });

  let levelName = "";

  await test.step("6. Enrich — add a course + level (never a prerequisite, just enrichment)", async () => {
    await page.goto("/content-library/courses");
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await page.getByLabel("Name").fill(courseName);
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page.getByText("Course created.")).toBeVisible();

    const courseRow = page.getByRole("row", { name: new RegExp(courseName) });
    await courseRow.getByRole("button", { name: "Actions" }).click();
    await page.getByRole("menuitem", { name: "Manage levels" }).click();
    await page.waitForURL("**/content-library/courses/**");

    levelName = "Level 1";
    await page.getByRole("button", { name: "Add level" }).click();
    await page.getByLabel("Name").fill(levelName);
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page.getByText("Level created.")).toBeVisible();
  });

  await test.step("7-8a. Assess & Placement — build a placement form in the form builder", async () => {
    await page.goto("/assessments");
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "New assessment" }),
    ).toBeVisible();

    await page.getByLabel("Title").fill(placementFormTitle);
    await page.getByLabel("Type").click();
    await page.getByRole("option", { name: "Placement test" }).click();
    await page.getByLabel("Status").click();
    await page.getByRole("option", { name: "Published" }).click();
    await page.getByRole("button", { name: "Create", exact: true }).click();

    const row = page.getByRole("row", { name: new RegExp(placementFormTitle) });
    await row.getByRole("button", { name: "Actions" }).click();
    await page.getByRole("menuitem", { name: "Builder" }).click();
    await page.waitForURL("**/assessments/**");

    await page.getByRole("button", { name: "Add section" }).click();
    await page.getByLabel("Title").fill("Questions");
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page.getByText("Section created.")).toBeVisible();

    await page.getByRole("button", { name: "Questions" }).click();
    await page.getByRole("button", { name: "Add question" }).click();
    await page
      .getByLabel("Question", { exact: true })
      .fill("What is your current English level?");
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page.getByText("Question created.")).toBeVisible();

    await page
      .getByRole("button", { name: "What is your current English level?" })
      .click();
    await page.getByRole("button", { name: "Add answer" }).click();
    await page.getByLabel("Answer", { exact: true }).fill("Beginner");
    await page.getByRole("switch", { name: "Correct answer" }).click();
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page.getByText("Answer added.")).toBeVisible();
  });

  await test.step("8b. Placement — assign, record, and review the placement test", async () => {
    await page.goto("/learning-flow/trainees");
    await page.getByRole("link", { name: "Fatma Rageh" }).click();
    await page.waitForURL("**/learning-flow/trainees/**");

    await page
      .getByRole("button", { name: "Assign a placement test" })
      .first()
      .click();
    await page.getByLabel("Placement form").click();
    await page.getByRole("option", { name: placementFormTitle }).click();
    await page.getByRole("button", { name: "Create", exact: true }).click();

    await page.getByRole("button", { name: "Record answers" }).click();
    await page.getByRole("checkbox", { name: "Beginner" }).click();
    await page.getByRole("button", { name: "Save" }).click();

    await page.getByRole("button", { name: "Assign a level" }).click();
    await page.getByLabel("Course").click();
    await page.getByRole("option", { name: courseName }).click();
    await page.getByLabel("Assigned level").click();
    await page.getByRole("option", { name: levelName }).click();
    await page.getByRole("button", { name: "Save" }).click();
  });

  await test.step("9. Progress — the trainee detail page shows enrollment/level progress", async () => {
    await expect(
      page.locator("main").getByText("Enrollments", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(placementFormTitle)).toBeVisible();
  });

  await test.step("11. Grow — a large import hits the free-plan student limit", async () => {
    await page.goto("/learning-flow/trainees");
    await page.getByRole("button", { name: "Import", exact: true }).click();

    const bigFixturePath = await buildOversizedTraineesImportFixture();
    await page.locator('input[type="file"]').setInputFiles(bigFixturePath);

    await expect(
      page.getByText(/plan has room for|None of these rows can be imported/),
    ).toBeVisible();
  });
});

test.afterAll(async () => {
  await closeDbConnection();
});
