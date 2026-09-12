import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { env } from "@/data/env/server";

/**
 * `npm run db:migrate` — applies the generated migrations in
 * `src/drizzle/migrations` to `DATABASE_URL`.
 *
 * drizzle-orm's migrator rather than `drizzle-kit migrate`: both read the same
 * `_journal.json` and record into the same `drizzle.__drizzle_migrations`
 * table, but drizzle-kit renders failures through its spinner UI, which only
 * draws on a TTY. On Vercel the build log therefore showed "applying
 * migrations..." and exit code 1 with no reason at all. This script prints
 * the failing statement's error like any other exception, which is what a
 * build log is for.
 */
const MIGRATIONS_FOLDER = "src/drizzle/migrations";

async function main(): Promise<void> {
  // One connection, no pool: this process runs a serial batch and exits.
  const client = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  try {
    console.info(`Applying migrations from ${MIGRATIONS_FOLDER}…`);
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    console.info("Migrations applied.");
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error("Migration failed.");
  console.error(error);
  process.exit(1);
});
