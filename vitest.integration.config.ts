import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * DB-backed integration tests, kept in their own config and their own script
 * (`npm run test:isolation`) so `npm test` stays a pure unit suite that needs
 * nothing running. These need local Docker Postgres — see README.md.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./tests/stubs/server-only.ts"),
    },
  },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["./tests/integration/lib/load-env.ts"],
    // These share one database. Running files in parallel would have them
    // creating and tearing down fixture organizations on top of each other.
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
