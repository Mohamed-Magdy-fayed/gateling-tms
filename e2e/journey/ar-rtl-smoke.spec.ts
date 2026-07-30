import { expect, test } from "@playwright/test";
import {
  SEED_ADMIN_EMAIL,
  SEED_DEFAULT_PASSWORD,
} from "@/drizzle/seed/constants";

/**
 * AR/RTL smoke over a couple of authenticated (system) screens — the
 * existing e2e/home.spec.ts already covers this for the public marketing
 * site; this is the same check extended to pages behind sign-in, which
 * nothing exercised before this segment.
 */
test("dashboard and groups render RTL in Arabic", async ({ page, context }) => {
  await context.addCookies([
    {
      name: "NEXT_LOCALE",
      value: "ar",
      domain: "localhost",
      path: "/",
    },
  ]);

  await page.goto("/auth/sign-in");
  await page.getByLabel("البريد الإلكتروني").fill(SEED_ADMIN_EMAIL);
  await page.getByRole("button", { name: "متابعة" }).click();
  await page
    .getByLabel("كلمة المرور", { exact: true })
    .fill(SEED_DEFAULT_PASSWORD);
  await page.getByRole("button", { name: "تسجيل الدخول", exact: true }).click();
  await page.waitForURL("**/dashboard");

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  await page.goto("/learning-flow/groups");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { name: "المجموعات" })).toBeVisible();
});
