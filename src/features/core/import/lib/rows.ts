import type { HeaderMapping } from "./headers";
import type {
  ImportColumn,
  ImportRecord,
  ImportRowError,
  InvalidImportRow,
  ValidImportRow,
} from "./types";

/** The header occupies spreadsheet row 1, so the first data row is row 2. */
const FIRST_DATA_ROW_NUMBER = 2;

function cellAt(row: string[], index: number | undefined): string {
  if (index === undefined) return "";
  return (row[index] ?? "").trim();
}

/**
 * Turns the file's data rows into records keyed by canonical column key.
 * Rows where every mapped cell is blank are dropped rather than reported as
 * invalid — spreadsheets routinely carry a tail of empty rows the user never
 * typed in.
 */
export function toRecords(
  dataRows: string[][],
  mapping: HeaderMapping,
  columns: ImportColumn[],
): ImportRecord[] {
  const records: ImportRecord[] = [];

  dataRows.forEach((row, index) => {
    const values: Record<string, string> = {};
    let hasValue = false;

    for (const column of columns) {
      const value = cellAt(row, mapping.columnIndexByKey[column.key]);
      values[column.key] = value;
      if (value !== "") hasValue = true;
    }

    if (!hasValue) return;
    records.push({ rowNumber: FIRST_DATA_ROW_NUMBER + index, values });
  });

  return records;
}

/**
 * A validator over one record's raw cell values. Returns the typed row on
 * success, or the per-column errors to show on the review screen. Zod's
 * `safeParse` result maps onto this directly (see `zodRowValidator`).
 */
export type RowValidator<TParsed> = (
  values: Record<string, string>,
) => { ok: true; parsed: TParsed } | { ok: false; errors: ImportRowError[] };

export type ReviewedRows<TParsed> = {
  valid: ValidImportRow<TParsed>[];
  invalid: InvalidImportRow[];
};

export function reviewRows<TParsed>(
  records: ImportRecord[],
  validate: RowValidator<TParsed>,
): ReviewedRows<TParsed> {
  const valid: ValidImportRow<TParsed>[] = [];
  const invalid: InvalidImportRow[] = [];

  for (const record of records) {
    const result = validate(record.values);
    if (result.ok) {
      valid.push({ ...record, parsed: result.parsed });
    } else {
      invalid.push({ ...record, errors: result.errors });
    }
  }

  return { valid, invalid };
}

/**
 * Moves rows that repeat an earlier row's identity (same email, same id, …)
 * out of `valid` and into `invalid`. Without this a file listing the same
 * student twice silently creates two of them — the database has no unique
 * constraint to catch it, because a roster legitimately holds two people with
 * the same name.
 *
 * The first occurrence stays valid; later ones carry the duplicate error.
 * A blank identity is not a duplicate — those rows are simply not comparable.
 */
export function flagDuplicateRows<TParsed>(
  reviewed: ReviewedRows<TParsed>,
  identityOf: (row: ValidImportRow<TParsed>) => string | null,
  error: ImportRowError,
): ReviewedRows<TParsed> {
  const seen = new Set<string>();
  const valid: ValidImportRow<TParsed>[] = [];
  const duplicates: InvalidImportRow[] = [];

  for (const row of reviewed.valid) {
    const identity = identityOf(row);
    if (identity === null || identity === "") {
      valid.push(row);
      continue;
    }
    if (seen.has(identity)) {
      duplicates.push({
        rowNumber: row.rowNumber,
        values: row.values,
        errors: [error],
      });
      continue;
    }
    seen.add(identity);
    valid.push(row);
  }

  return {
    valid,
    invalid: [...reviewed.invalid, ...duplicates].sort(
      (a, b) => a.rowNumber - b.rowNumber,
    ),
  };
}
