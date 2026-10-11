import { and, eq, getTableColumns, inArray, sql } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { db } from "@/drizzle";

/**
 * The two operations the showcase profile is allowed to perform. Neither ever
 * deletes, and neither touches a row someone has edited in the app.
 */

const CHUNK = 500;

function chunks<T>(rows: T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

function columnsOf(table: PgTable): Record<string, AnyPgColumn> {
  return getTableColumns(table) as Record<string, AnyPgColumn>;
}

type IdRow = { id?: string };

/**
 * Inserts the rows whose id isn't in the table yet. Rows the app deleted come
 * back; rows that exist are left exactly as they are. `onConflictDoNothing`
 * also swallows a clash on any other unique key (say, a class someone
 * recreated at the same time by hand), rather than failing the build.
 */
export async function insertMissing<T extends PgTable>(
  table: T,
  rows: T["$inferInsert"][],
  label: string,
): Promise<number> {
  const ids = (rows as IdRow[])
    .map((row) => row.id)
    .filter((id): id is string => !!id);
  const existing = new Set<string>();
  const cols = columnsOf(table);
  for (const idChunk of chunks(ids, 5000)) {
    const found = await db
      .select({ id: cols.id })
      .from(table as PgTable)
      .where(inArray(cols.id, idChunk));
    for (const row of found) existing.add(row.id as string);
  }

  const missing = rows.filter((row) => {
    const id = (row as IdRow).id;
    return !id || !existing.has(id);
  });
  for (const part of chunks(missing)) {
    await db.insert(table).values(part).onConflictDoNothing();
  }
  // Id-less rows (composite keys) can only be ensured, not counted.
  console.info(
    ids.length === 0
      ? `showcase ${label}: ${rows.length} ensured`
      : `showcase ${label}: ${missing.length} added, ${rows.length - missing.length} already there`,
  );
  return missing.length;
}

/**
 * Moves seeded rows along their lifecycle (a class that has now happened
 * becomes "completed", a cohort that ended becomes "completed", …) — but only
 * a row nobody has touched since it was seeded. Seeded rows are written with
 * `updatedAt = createdAt`, any edit in the app bumps `updatedAt`, and this
 * update keeps the two equal, so an edited row is never overwritten.
 */
export async function advanceUntouched<T extends PgTable>(
  table: T,
  desired: T["$inferInsert"][],
  fields: string[],
  label: string,
): Promise<number> {
  const cols = columnsOf(table);
  const selection: Record<string, AnyPgColumn> = {
    id: cols.id,
    createdAt: cols.createdAt,
    updatedAt: cols.updatedAt,
  };
  for (const field of fields) selection[field] = cols[field];

  const desiredById = new Map<string, Record<string, unknown>>();
  for (const row of desired as Record<string, unknown>[]) {
    desiredById.set(row.id as string, row);
  }

  const patches = new Map<
    string,
    { patch: Record<string, unknown>; ids: string[] }
  >();
  for (const idChunk of chunks([...desiredById.keys()], 5000)) {
    const current = await db
      .select(selection)
      .from(table as PgTable)
      .where(inArray(cols.id, idChunk));
    for (const row of current as Record<string, unknown>[]) {
      const createdAt = row.createdAt as Date | null;
      const updatedAt = row.updatedAt as Date | null;
      if (
        !createdAt ||
        !updatedAt ||
        createdAt.getTime() !== updatedAt.getTime()
      )
        continue;

      const want = desiredById.get(row.id as string);
      if (!want) continue;
      const patch: Record<string, unknown> = {};
      for (const field of fields) {
        if (!sameValue(row[field], want[field] ?? null))
          patch[field] = want[field] ?? null;
      }
      if (Object.keys(patch).length === 0) continue;

      const key = JSON.stringify(patch);
      const group = patches.get(key) ?? { patch, ids: [] };
      group.ids.push(row.id as string);
      patches.set(key, group);
    }
  }

  let advanced = 0;
  for (const { patch, ids } of patches.values()) {
    for (const idChunk of chunks(ids)) {
      await db
        .update(table)
        .set({ ...patch, updatedAt: sql`${cols.createdAt}` } as never)
        .where(
          and(inArray(cols.id, idChunk), eq(cols.updatedAt, cols.createdAt)),
        );
      advanced += idChunk.length;
    }
  }
  console.info(`showcase ${label}: ${advanced} moved forward in time`);
  return advanced;
}

function sameValue(a: unknown, b: unknown): boolean {
  if (a instanceof Date || b instanceof Date) {
    return (
      a instanceof Date && b instanceof Date && a.getTime() === b.getTime()
    );
  }
  return (a ?? null) === (b ?? null);
}
