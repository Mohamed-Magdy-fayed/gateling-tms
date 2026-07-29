import {
  flagDuplicateRows,
  type ImportColumn,
  type ImportRowAction,
  type ImportRowError,
  type MessageKey,
  mapHeaders,
  type ReviewedRows,
  type RowValidator,
  reviewRows,
  toRecords,
  type ValidImportRow,
} from "../lib";
import type { WorkbookTable } from "./workbook";

export type ReviewImportTableParams<TParsed> = {
  table: WorkbookTable;
  columns: ImportColumn[];
  validate: RowValidator<TParsed>;
  translateLabel: (key: MessageKey) => string;
  /** Optional within-file identity check (same email twice, same id twice). */
  duplicate?: {
    identityOf: (row: ValidImportRow<TParsed>) => string | null;
    error: ImportRowError;
  };
};

export type ReviewImportTableResult<TParsed> =
  | { ok: false; missingColumnLabels: string[] }
  | {
      ok: true;
      reviewed: ReviewedRows<TParsed>;
      unknownHeaders: string[];
      totalRows: number;
    };

/**
 * The entity-independent half of a preview: match the file's headers, turn its
 * rows into records, validate each one, and separate rows that repeat an
 * earlier row's identity. What each surviving row would *do* (create vs.
 * update) and whether the plan has room for it are the entity's own business.
 */
export function reviewImportTable<TParsed>({
  table,
  columns,
  validate,
  translateLabel,
  duplicate,
}: ReviewImportTableParams<TParsed>): ReviewImportTableResult<TParsed> {
  const mapping = mapHeaders(table.headers, columns);

  if (mapping.missingRequiredKeys.length > 0) {
    const labelByKey = new Map(
      columns.map((column) => [column.key, translateLabel(column.labelKey)]),
    );
    return {
      ok: false,
      missingColumnLabels: mapping.missingRequiredKeys.map(
        (key) => labelByKey.get(key) ?? key,
      ),
    };
  }

  const records = toRecords(table.rows, mapping, columns);
  const validated = reviewRows(records, validate);
  const reviewed = duplicate
    ? flagDuplicateRows(validated, duplicate.identityOf, duplicate.error)
    : validated;

  return {
    ok: true,
    reviewed,
    unknownHeaders: mapping.unknownHeaders,
    totalRows: records.length,
  };
}

/**
 * How many rows from the top of the file can be committed before the
 * organization's plan runs out of room. Rows that update an existing record
 * don't consume capacity, so a file that is mostly corrections stays fully
 * importable even on a full plan. `null` capacity means unlimited.
 */
export function capacityCutoff(
  actions: ImportRowAction[],
  remainingCapacity: number | null,
): number {
  if (remainingCapacity === null) return actions.length;

  let creates = 0;
  for (let index = 0; index < actions.length; index++) {
    if (actions[index] === "create") {
      if (creates + 1 > remainingCapacity) return index;
      creates++;
    }
  }
  return actions.length;
}
