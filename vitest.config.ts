import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Mirrors tsconfig.json's "@/*" -> "./src/*" path mapping so unit tests
  // can import modules that use the `@/` alias (e.g. schemas.ts pulling in
  // the i18n dictionary for translation keys) without rewriting every
  // import to a relative path.
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    // Unit tests only — e2e/ belongs to Playwright.
    include: ["tests/**/*.test.ts"],
  },
});
