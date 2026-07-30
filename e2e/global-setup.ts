// Must be the first import: Playwright's Node process doesn't inherit
// Next's env loading, and `@/drizzle` (imported below) reads env vars at
// module-evaluation time — dotenv has to run before that import evaluates.
// `dotenv/config`'s own default (load `.env` from `process.cwd()`) is
// exactly what's needed here, same as src/drizzle/seed/cli.ts's explicit
// version of the same load.
import "dotenv/config";

import { closeDbConnection } from "@/drizzle";
import { runSeedProfile } from "@/drizzle/seed";

/**
 * Ensures the `demo` seed profile (which seeds `baseline` first) exists
 * before the journey specs run — additive-only/idempotent, so running this
 * on every `test:e2e` invocation is safe regardless of what's already in the
 * database. Runs for every project, including the marketing-smoke
 * `desktop`/`mobile` ones that don't need it — harmless (a no-op skip
 * check), and not worth a per-project split for the sake of skipping it.
 *
 * Static imports, not dynamic `await import(...)` — Playwright's esbuild
 * transform resolves the `@/*` tsconfig path alias for statically-analyzable
 * imports but not for runtime dynamic ones.
 */
async function globalSetup() {
  await runSeedProfile("demo");
  await closeDbConnection();
}

export default globalSetup;
