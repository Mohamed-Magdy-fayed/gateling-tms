import { expect, test } from "@playwright/test";

test("about page renders", async ({ page }) => {
  await page.goto("/about");
  await expect(
    page.getByRole("heading", {
      name: "Built for how academies actually run",
      level: 1,
    }),
  ).toBeVisible();
});

test("privacy, terms, cookies, and refund pages render with a heading and last-updated label", async ({
  page,
}) => {
  const pages: Array<{ path: string; heading: string }> = [
    { path: "/privacy", heading: "Privacy Policy" },
    { path: "/terms", heading: "Terms of Service" },
    { path: "/cookies", heading: "Cookies Policy" },
    { path: "/refund", heading: "Refund Policy" },
  ];

  for (const { path, heading } of pages) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: heading, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("Last updated:")).toBeVisible();
  }
});

test("about page renders in Arabic after switching language", async ({
  page,
}) => {
  await page.goto("/about");
  await page.getByRole("button", { name: "Switch language" }).click();

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("heading", {
      name: "مصمم ليناسب طريقة عمل الأكاديميات فعليًا",
      level: 1,
    }),
  ).toBeVisible();
});
