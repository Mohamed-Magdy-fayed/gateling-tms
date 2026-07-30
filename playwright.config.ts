import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// `npm run preview` (below) is `next build && next start`, which sets
// NODE_ENV=production — Next's own env-file precedence then prefers
// `.env.production.local` (the real Neon production database) over plain
// `.env`. Loading `.env` into this process's `process.env` first means the
// spawned webServer inherits it already set, and Next's loader skips a key
// that's already present rather than overwriting it — so the e2e run stays
// on local Docker Postgres regardless of NODE_ENV, matching
// docs/rebuild/06-workflow.md's dev-uses-local-Docker rule.
loadEnv({ path: path.resolve(process.cwd(), ".env") });

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "dot" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      testIgnore: "**/journey/**",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      testIgnore: "**/journey/**",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "journey",
      testDir: "./e2e/journey",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run preview",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: process.env as Record<string, string>,
  },
});
