import { config } from "dotenv";

/**
 * Loads `.env` before any test module is imported.
 *
 * It has to be a vitest `setupFiles` entry rather than an import inside the
 * harness: `src/data/env/server.ts` validates the environment at
 * module-evaluation time, and ES import hoisting means it would already have
 * run (and thrown) by the time a side-effecting import in the harness executed.
 *
 * `override: true` matters. Vite owns a variable called `BASE_URL` — its own
 * public base path, `"/"` by default — and it is already in `process.env` by
 * the time this runs. dotenv's default is to leave an existing value alone, so
 * without the override the app's `BASE_URL` reads as `"/"`, fails its `z.url()`
 * check, and the whole suite dies at import with a confusing "Invalid URL".
 * Overriding is also simply what a test run wants: the local `.env` is the
 * source of truth here, not whatever the runner happens to have set.
 */
config({ override: true });
