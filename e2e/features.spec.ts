import { expect, test } from "@playwright/test";

test("features page shows free and coming-soon badges", async ({ page }) => {
  await page.goto("/features");
  await expect(
    page.getByRole("heading", {
      name: "Everything your academy needs",
      level: 1,
    }),
  ).toBeVisible();

  await expect(page.getByText("Free").first()).toBeVisible();
  await expect(page.getByText("Coming soon").first()).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Content Library", level: 3 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "HR Management", level: 3 }),
  ).toBeVisible();
});

test("features page renders in Arabic after switching language", async ({
  page,
}) => {
  await page.goto("/features");
  await page.getByRole("button", { name: "Switch language" }).click();

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("heading", { name: "كل ما تحتاجه أكاديميتك", level: 1 }),
  ).toBeVisible();
});
