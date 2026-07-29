/**
 * Spreadsheet software treats a CSV cell starting with `=`, `+`, `-`, `@`, a
 * tab or a carriage return as a formula, so a value typed into the app and
 * later exported could execute when someone opens the file. Quoting doesn't
 * help — the quotes are consumed by the CSV parser before the formula rule is
 * applied.
 *
 * The fix is the conventional apostrophe prefix, made reversible so it doesn't
 * break the export → edit → re-import round trip: a value that *already*
 * begins with apostrophes followed by a dangerous character gets one more, and
 * the import side removes exactly one. Both directions live here so they can't
 * drift apart.
 *
 * Only CSV needs this. An XLSX cell written by exceljs is typed as a string,
 * and a string cell is never evaluated as a formula however it starts.
 */

const FORMULA_LEAD = /^'*[=+\-@\t\r]/;
const ESCAPED_FORMULA_LEAD = /^'+[=+\-@\t\r]/;

export function escapeSpreadsheetCell(value: string): string {
  return FORMULA_LEAD.test(value) ? `'${value}` : value;
}

/**
 * Undoes `escapeSpreadsheetCell`. A hand-typed cell that genuinely starts with
 * an apostrophe *and* a dangerous character loses that apostrophe — the same
 * thing every spreadsheet does when it opens the file, since the apostrophe is
 * how they mark "this is text, not a formula".
 */
export function unescapeSpreadsheetCell(value: string): string {
  return ESCAPED_FORMULA_LEAD.test(value) ? value.slice(1) : value;
}
