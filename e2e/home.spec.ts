import { expect, test } from "@playwright/test";

test("home page renders in English", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(
    page.getByRole("heading", {
      name: "Your gateway to manage your online teaching business",
      level: 1,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Get Started Free" }).first(),
  ).toBeVisible();
});

test("home page renders in Arabic after switching language", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Switch language" }).click();

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("heading", {
      name: "بوابتك لإدارة عملك التعليمي عبر الإنترنت",
      level: 1,
    }),
  ).toBeVisible();
});

test("header and footer have no dead links", async ({ page, request }) => {
  await page.goto("/");

  const hrefs = await page
    .locator("header a[href^='/'], footer a[href^='/']")
    .evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).pathname),
    );
  const uniqueHrefs = [...new Set(hrefs)];

  expect(uniqueHrefs.length).toBeGreaterThan(0);

  for (const href of uniqueHrefs) {
    const response = await request.get(href);
    expect(response.status(), `${href} should not 404`).toBeLessThan(400);
  }
});
