import type { ImportRowError } from "./types";

/** What committing one reviewed row would do to the database. */
export type ImportRowAction = "create" | "update";

export type ImportPreviewColumn = {
  key: string;
  /** Already localized — the review table renders it as-is. */
  label: string;
  required: boolean;
};

export type ImportPreviewValidRow = {
  rowNumber: number;
  values: Record<string, string>;
  action: ImportRowAction;
};

export type ImportPreviewInvalidRow = {
  rowNumber: number;
  values: Record<string, string>;
  errors: ImportRowError[];
};

/**
 * Everything the review screen needs, and nothing it doesn't: the client
 * re-sends the raw `values` of the rows the user confirms, and the server
 * re-runs the exact same validation on commit. Nothing is held server-side
 * between the two calls.
 */
export type ImportPreviewResult = {
  columns: ImportPreviewColumn[];
  /** Non-empty data rows found in the file, valid or not. */
  totalRows: number;
  validRows: ImportPreviewValidRow[];
  invalidRows: ImportPreviewInvalidRow[];
  /** Headers in the file that matched no known column. */
  unknownHeaders: string[];
  /**
   * How many of `validRows` fit inside the organization's plan, counted from
   * the top of the file. Equals `validRows.length` when nothing is capped.
   */
  importableCount: number;
};

export type ImportCommitResult = {
  created: number;
  updated: number;
};
