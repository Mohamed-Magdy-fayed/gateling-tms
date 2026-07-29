/**
 * Shared by the upload dialog, the tRPC input schemas and the parser, so the
 * three agree on what "too big" means. Kept free of any server-only import
 * (exceljs lives one folder over) — client bundles pull these constants in.
 */

/**
 * 2 MB of spreadsheet is far more than any plan's roster needs (the largest is
 * 1000 students) while staying small enough to parse inside one request.
 */
export const MAX_IMPORT_FILE_BYTES = 2 * 1024 * 1024;

/** Base64 inflates raw bytes by 4/3 — checked before decoding. */
export const MAX_IMPORT_BASE64_LENGTH =
  Math.ceil(MAX_IMPORT_FILE_BYTES / 3) * 4;

/**
 * Hard cap on data rows in one file. Keeps a single import inside one request
 * and one transaction; a bigger migration is split across files. See
 * `docs/rebuild/STATE.md` D114 for why this is synchronous rather than an
 * Inngest batch job.
 */
export const MAX_IMPORT_ROWS = 1000;

export const IMPORT_FILE_EXTENSIONS = ["csv", "xlsx"] as const;

/** `accept` attribute for the upload input. */
export const IMPORT_FILE_ACCEPT = ".csv,.xlsx";
