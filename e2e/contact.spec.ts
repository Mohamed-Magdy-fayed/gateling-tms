import { expect, test } from "@playwright/test";

test("contact page renders the form and validates required fields", async ({
  page,
}) => {
  await page.goto("/contact");
  await expect(
    page.getByRole("heading", { name: "Get in touch", level: 1 }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.getByText("This field is required.").first()).toBeVisible();
});

test("contact page renders in Arabic after switching language", async ({
  page,
}) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "Switch language" }).click();

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("heading", { name: "تواصل معنا", level: 1 }),
  ).toBeVisible();
});
