import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Mirrors tsconfig.json's "@/*" -> "./src/*" path mapping so unit tests
  // can import modules that use the `@/` alias (e.g. schemas.ts pulling in
  // the i18n dictionary for translation keys) without rewriting every
  // import to a relative path.
  // `server-only` is a build-time guard: its whole job is to throw when a
  // client bundle imports it, and vitest is neither. Stubbing it lets modules
  // that legitimately carry the marker — the Gateling Meetings client holds
  // the deployment's API key, so it must — still be unit-tested, instead of
  // forcing the choice between "testable" and "can't be imported into a
  // client component".
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./tests/stubs/server-only.ts"),
    },
  },
  test: {
    // Unit tests only — e2e/ belongs to Playwright, and tests/integration/
    // needs a live database, so it has its own config and script
    // (`npm run test:isolation`). Excluding it keeps `npm test` runnable with
    // nothing but the repo checked out.
    //
    // The Meetings client block (`@gateling/meetings-integration`) ships its
    // own specs beside the code it covers, and they are the contract tests for
    // an API this app doesn't own — so they run with the rest.
    include: ["tests/**/*.test.ts", "src/integrations/meetings/*.test.ts"],
    exclude: ["tests/integration/**"],
  },
});
