import { expect, test } from "@playwright/test";
import {
  SEED_ADMIN_EMAIL,
  SEED_DEFAULT_PASSWORD,
} from "@/drizzle/seed/constants";

/**
 * The CSP is *enforced*, not Report-Only, so a mistake in it doesn't warn —
 * it breaks the page. This is the check that says otherwise: it walks the
 * heaviest surfaces with the browser's own violation reporting wired up and
 * fails on any blocked resource.
 *
 * Pages picked for what they exercise rather than for coverage: the landing
 * page (next/font, JSON-LD, remote images), the dashboard (next-themes' inline
 * theme script, the tRPC client), and the assessment builder (Base UI overlays,
 * which are what forced `style-src 'unsafe-inline'`).
 */
const AUTHENTICATED_PAGES = ["/dashboard", "/assessments", "/organizations"];

type Violation = { page: string; message: string };

test("security headers are present on the landing page", async ({ page }) => {
  const response = await page.goto("/");
  const headers = response?.headers() ?? {};

  const csp = headers["content-security-policy"];
  expect(csp, "Content-Security-Policy header").toBeTruthy();
  expect(csp).toContain("'strict-dynamic'");
  expect(csp).toMatch(/script-src[^;]*'nonce-[0-9a-f]{32}'/);
  expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
  expect(csp).toContain("frame-ancestors 'none'");

  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
  // Nothing gains from advertising the framework version.
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("the nonce is different on every request", async ({ page }) => {
  const first = (await page.goto("/"))?.headers()["content-security-policy"];
  const second = (await page.goto("/pricing"))?.headers()[
    "content-security-policy"
  ];

  const nonceOf = (csp?: string) => csp?.match(/'nonce-([0-9a-f]{32})'/)?.[1];
  expect(nonceOf(first)).toBeTruthy();
  expect(nonceOf(second)).toBeTruthy();
  expect(nonceOf(first)).not.toBe(nonceOf(second));
});

test("no CSP violations on the public or authenticated pages", async ({
  page,
}) => {
  const violations: Violation[] = [];

  page.on("console", (message) => {
    const text = message.text();
    if (/Content Security Policy|Refused to (load|execute|apply)/i.test(text)) {
      violations.push({ page: page.url(), message: text });
    }
  });

  await page.goto("/");
  await page.goto("/testimonials");
  await page.goto("/pricing");

  await page.goto("/auth/sign-in");
  await page.getByLabel("Email").fill(SEED_ADMIN_EMAIL);
  await page.getByRole("button", { name: "Continue" }).click();
  await page
    .getByLabel("Password", { exact: true })
    .fill(SEED_DEFAULT_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/dashboard");

  for (const path of AUTHENTICATED_PAGES) {
    await page.goto(path);
    // The page has to actually render, not just respond — a CSP that blocks
    // the framework bundle still returns 200 with an empty shell.
    await expect(
      page.locator("main, [data-slot='sidebar-inset']").first(),
    ).toBeVisible();
  }

  expect(
    violations,
    `CSP violations:\n${violations.map((v) => `  ${v.page}: ${v.message}`).join("\n")}`,
  ).toHaveLength(0);
});

test("the theme script runs, so there is no flash of the wrong theme", async ({
  page,
}) => {
  await page.goto("/");
  // next-themes' inline script is what writes this class before first paint.
  // If the nonce were missing, script-src would block it and the attribute
  // would never appear.
  await expect(page.locator("html")).toHaveAttribute("class", /light|dark/);
});
