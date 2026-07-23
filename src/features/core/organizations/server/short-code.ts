import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import type { db as dbClient } from "@/drizzle";
import { OrganizationsTable } from "@/drizzle/schema";

const SHORT_CODE_LENGTH = 8;
const RANDOM_SUFFIX_LENGTH = 4;
const MAX_ATTEMPTS = 10;

function baseFromName(name: string) {
  const cleaned = name.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const prefixLength = SHORT_CODE_LENGTH - RANDOM_SUFFIX_LENGTH;
  return (cleaned || "ORG").slice(0, prefixLength);
}

function randomSuffix() {
  return crypto
    .randomBytes(RANDOM_SUFFIX_LENGTH)
    .toString("hex")
    .toUpperCase()
    .slice(0, RANDOM_SUFFIX_LENGTH);
}

/**
 * Organizations don't have a user-chosen short code (unlike DONOR-B's
 * branches, where an admin typed one in) — it only exists as a stable
 * internal natural key (seed lookups, `organizations_short_code_idx`), so it
 * is generated from the org name plus a random suffix and retried on
 * collision.
 */
export async function generateUniqueOrganizationShortCode(
  db: Pick<typeof dbClient, "query">,
  name: string,
): Promise<string> {
  const base = baseFromName(name);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = `${base}${randomSuffix()}`.slice(0, SHORT_CODE_LENGTH);
    const existing = await db.query.OrganizationsTable.findFirst({
      where: eq(OrganizationsTable.shortCode, candidate),
      columns: { id: true },
    });
    if (!existing) return candidate;
  }

  throw new Error("Could not generate a unique organization short code");
}
