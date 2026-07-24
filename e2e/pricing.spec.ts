import { expect, test } from "@playwright/test";

test("pricing page shows four tiers with exactly one enabled CTA", async ({
  page,
}) => {
  await page.goto("/pricing");
  await expect(
    page.getByRole("heading", {
      name: "Choose the plan for your academy",
      level: 1,
    }),
  ).toBeVisible();

  for (const planName of ["Free", "Basic", "Professional", "Enterprise"]) {
    await expect(
      page.getByRole("heading", { name: planName, level: 3 }),
    ).toBeVisible();
  }

  const main = page.locator("main");
  const enabledCtas = main.getByRole("link", { name: "Get Started Free" });
  await expect(enabledCtas).toHaveCount(1);

  const disabledCtas = main.getByRole("button", { name: "Coming soon" });
  await expect(disabledCtas).toHaveCount(3);
  for (const button of await disabledCtas.all()) {
    await expect(button).toBeDisabled();
  }
});

test("pricing page renders in Arabic after switching language", async ({
  page,
}) => {
  await page.goto("/pricing");
  await page.getByRole("button", { name: "Switch language" }).click();

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("heading", {
      name: "اختر الخطة المناسبة لأكاديميتك",
      level: 1,
    }),
  ).toBeVisible();
});
