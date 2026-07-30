import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import type { db as database, Transaction } from "@/drizzle";
import { GroupsTable, TraineesTable } from "@/drizzle/schema";
import { matchKey, type TraineeDirectory } from "./import-reference-keys";

/** Reads run either on the request connection or inside a commit's transaction. */
export type Reader = typeof database | Transaction;

/**
 * Advisory-lock seed for group creation, distinct from the group-schedule
 * lock's seed 0 (`on-group-schedule-changed.ts`) so the two never contend on
 * the same key even if a group id and an organization id ever hashed alike.
 */
const GROUP_CREATE_LOCK_SEED = 1;

/**
 * The trainees a file refers to, looked up by the two columns an enrollment or
 * roster row can name one with. Soft-deleted trainees are excluded — an import
 * must not attach an enrollment to someone who was removed.
 */
export async function findTraineeDirectory(
  reader: Reader,
  organizationId: string,
  emailKeys: string[],
  nameKeys: string[],
): Promise<TraineeDirectory> {
  const byEmail = new Map<string, string>();
  const idsByName = new Map<string, string[]>();
  if (emailKeys.length === 0 && nameKeys.length === 0) {
    return { byEmail, idsByName };
  }

  const identityMatches = [
    emailKeys.length > 0
      ? inArray(sql`lower(${TraineesTable.email})`, emailKeys)
      : undefined,
    nameKeys.length > 0
      ? inArray(sql`lower(${TraineesTable.name})`, nameKeys)
      : undefined,
  ].filter((condition) => condition !== undefined);

  const matches = await reader
    .select({
      id: TraineesTable.id,
      name: TraineesTable.name,
      email: TraineesTable.email,
    })
    .from(TraineesTable)
    .where(
      and(
        eq(TraineesTable.organizationId, organizationId),
        isNull(TraineesTable.deletedAt),
        or(...identityMatches),
      ),
    )
    .orderBy(TraineesTable.id);

  for (const trainee of matches) {
    // Nothing stops two trainees sharing an email either, so the lowest id
    // wins (the query is ordered) rather than row order deciding.
    if (trainee.email) {
      const key = matchKey(trainee.email);
      if (!byEmail.has(key)) byEmail.set(key, trainee.id);
    }

    const nameKey = matchKey(trainee.name);
    const existing = idsByName.get(nameKey);
    if (existing) existing.push(trainee.id);
    else idsByName.set(nameKey, [trainee.id]);
  }

  return { byEmail, idsByName };
}

/**
 * Resolves each distinct group name in a batch to a group id, creating the
 * ones that don't exist yet. An auto-created group carries no schedule, so it
 * generates no sessions until someone sets one — the roster is the point here,
 * not the calendar, and no `group/schedule-changed` event is fired.
 */
export async function resolveGroupIds(
  trx: Transaction,
  organizationId: string,
  names: string[],
): Promise<Map<string, string>> {
  const idByKey = new Map<string, string>();
  if (names.length === 0) return idByKey;

  // Serialize group creation per organization for the rest of this
  // transaction. This is a read-then-insert with no unique constraint behind
  // it — two groups may legitimately share a name (lowest id wins), so the
  // constraint that would otherwise catch a concurrent duplicate can't exist.
  // Without the lock, two overlapping imports each read "this name is missing"
  // and each insert it. Held until commit — same xact-lock idiom as
  // on-group-schedule-changed.ts.
  await trx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${organizationId}, ${GROUP_CREATE_LOCK_SEED}))`,
  );

  const existing = await trx
    .select({ id: GroupsTable.id, name: GroupsTable.name })
    .from(GroupsTable)
    .where(
      and(
        eq(GroupsTable.organizationId, organizationId),
        inArray(
          sql`lower(${GroupsTable.name})`,
          names.map((name) => matchKey(name)),
        ),
      ),
    )
    .orderBy(GroupsTable.id);

  for (const group of existing) {
    const key = matchKey(group.name);
    if (!idByKey.has(key)) idByKey.set(key, group.id);
  }

  const missing = names.filter((name) => !idByKey.has(matchKey(name)));
  if (missing.length === 0) return idByKey;

  const created = await trx
    .insert(GroupsTable)
    .values(missing.map((name) => ({ organizationId, name })))
    .returning({ id: GroupsTable.id, name: GroupsTable.name });

  for (const group of created) idByKey.set(matchKey(group.name), group.id);

  return idByKey;
}
