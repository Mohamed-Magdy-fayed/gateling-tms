import path from "node:path";

import { config as loadEnv } from "dotenv";

loadEnv({
  path: process.env.DOTENV_CONFIG_PATH ?? path.resolve(process.cwd(), ".env"),
});

const commands = {
  baseline: {
    description:
      "Seed the minimal local bootstrap profile: one dev organization + one admin user (idempotent — never clears, skips existing data).",
    action: async () => {
      const { runSeedProfile } = await import("@/drizzle/seed");
      await runSeedProfile("baseline");
    },
  },
  clear: {
    description: "Clear all data from the database tables.",
    action: async () => {
      const { clearDb } = await import("@/drizzle/seed/clear-db");
      await clearDb();
    },
  },
  help: {
    description: "Show this help message.",
    action: async () => {
      printHelp();
    },
  },
} as const;

type CommandName = keyof typeof commands;

function printHelp() {
  const entries = Object.entries(commands).filter(([name]) => name !== "help");
  console.log("Usage: npm run db:seed -- <command>\n");
  console.log("Commands:");
  for (const [name, info] of entries) {
    console.log(`  ${name.padEnd(12)} ${info.description}`);
  }
  console.log("\nExamples:");
  console.log("  npm run db:seed");
  console.log("  npm run db:seed:clear");
}

async function run() {
  const rawArg = process.argv[2]?.toLowerCase() as CommandName | undefined;
  const commandName: CommandName =
    rawArg && rawArg in commands ? rawArg : "baseline";

  if (commandName === "help") {
    printHelp();
    return;
  }

  const command = commands[commandName];
  console.log(`Running seed command: ${commandName}...`);

  let closeDbConnection: (() => Promise<void>) | undefined;
  try {
    ({ closeDbConnection } = await import("@/drizzle"));
    await command.action();
    console.log("Seed completed successfully.");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    if (closeDbConnection) {
      await closeDbConnection().catch((err) => {
        console.error("Failed to close database connection:", err);
      });
    }
  }
}

run().catch((error) => {
  console.error("Unexpected error while running seed command:", error);
  process.exit(1);
});
