/**
 * Seeds are additive-only and idempotent: each record is looked up by a
 * stable natural key first (e.g. email, short code — never a
 * random/re-generated id). If it already exists, it is left untouched
 * (never updated) and the run logs a skip. Only missing records are
 * inserted. No seed profile may delete data — see `clear-db.ts`, which is a
 * separate, manually invoked script (`npm run db:seed:clear`), never called
 * from the default seed flow.
 */
export async function seedIfMissing<TRow>({
  find,
  insert,
  label,
}: {
  /** Looks the record up by its stable natural key. */
  find: () => Promise<TRow | undefined>;
  /** Inserts the record. Only called when `find` returns nothing. */
  insert: () => Promise<TRow>;
  /** Human-readable label used in the skip/seed log line. */
  label: string;
}): Promise<TRow> {
  const existing = await find();
  if (existing) {
    console.info(`Already seeded, skipping: ${label}`);
    return existing;
  }

  const inserted = await insert();
  console.info(`Seeded: ${label}`);
  return inserted;
}
