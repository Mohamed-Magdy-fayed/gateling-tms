import ExcelJS from "exceljs";

/**
 * Everything in this module is server-only: exceljs is a large dependency and
 * has no business in a client bundle. Import it from route handlers and tRPC
 * procedures, never from a component.
 */

/**
 * Flattens whatever exceljs hands back for a cell into the plain string the
 * import pipeline works in. Numbers and dates are the interesting ones: a
 * phone number typed into Excel arrives as a number, and a date-formatted
 * cell arrives as a `Date`, neither of which a Zod string schema would accept.
 */
export function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("richText" in value) {
      return value.richText
        .map((part) => part.text)
        .join("")
        .trim();
    }
    if ("text" in value) return String(value.text).trim();
    if ("result" in value) return cellText(value.result as ExcelJS.CellValue);
    if ("error" in value) return "";
  }
  return String(value).trim();
}

/** Row values as a dense, 0-based array of strings. */
function rowToStrings(row: ExcelJS.Row, width: number): string[] {
  const cells: string[] = [];
  for (let column = 1; column <= width; column++) {
    cells.push(cellText(row.getCell(column).value));
  }
  return cells;
}

export type WorkbookTable = { headers: string[]; rows: string[][] };

/**
 * Reads the first worksheet as a header row plus data rows. Returns `null`
 * when the file has no worksheet or no header — the caller turns that into a
 * localized "this file has no data" error.
 */
export async function parseWorkbook(
  buffer: ArrayBuffer,
): Promise<WorkbookTable | null> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return null;

  const width = worksheet.columnCount;
  if (width < 1) return null;

  const rows: string[][] = [];
  let headers: string[] | null = null;

  worksheet.eachRow({ includeEmpty: true }, (row) => {
    const cells = rowToStrings(row, width);
    // Blank rows are dropped wherever they appear: above the header (a spacer
    // row), between records, or — most often — as the tail of a sheet whose
    // used range outgrew its data. Counting those against MAX_IMPORT_ROWS
    // would reject a perfectly ordinary file. Matches the CSV parser, which
    // already drops blank lines.
    if (cells.every((cell) => cell === "")) return;
    if (headers === null) {
      headers = cells;
      return;
    }
    rows.push(cells);
  });

  return headers === null ? null : { headers, rows };
}

export type TemplateSheetLabels = {
  /** Name of the sheet holding the headers and the example row. */
  dataSheetName: string;
  /** Name of the second sheet documenting each column. */
  referenceSheetName: string;
  referenceHeaders: { column: string; required: string; notes: string };
  requiredYes: string;
  requiredNo: string;
  rightToLeft: boolean;
};

export type TemplateColumnDoc = {
  label: string;
  required: boolean;
  example: string;
  hint: string;
};

/**
 * Builds the downloadable XLSX template: one sheet the user types into, and a
 * reference sheet documenting every column's meaning and valid values, so the
 * rules live in the file rather than only in the UI that produced it.
 */
export async function buildTemplateWorkbook(
  columns: TemplateColumnDoc[],
  labels: TemplateSheetLabels,
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const views = labels.rightToLeft ? [{ rightToLeft: true }] : undefined;

  const dataSheet = workbook.addWorksheet(labels.dataSheetName, { views });
  dataSheet.addRow(columns.map((column) => column.label));
  dataSheet.addRow(columns.map((column) => column.example));
  dataSheet.getRow(1).font = { bold: true };
  dataSheet.columns.forEach((column, index) => {
    const label = columns[index]?.label ?? "";
    column.width = Math.max(16, label.length + 4);
  });

  const referenceSheet = workbook.addWorksheet(labels.referenceSheetName, {
    views,
  });
  referenceSheet.addRow([
    labels.referenceHeaders.column,
    labels.referenceHeaders.required,
    labels.referenceHeaders.notes,
  ]);
  referenceSheet.getRow(1).font = { bold: true };
  for (const column of columns) {
    referenceSheet.addRow([
      column.label,
      column.required ? labels.requiredYes : labels.requiredNo,
      column.hint,
    ]);
  }
  referenceSheet.columns.forEach((column, index) => {
    column.width = index === 2 ? 60 : 24;
  });

  // exceljs types its own `Buffer` as an `ArrayBuffer`, which is exactly what
  // a `Response` body wants — no copy needed.
  return workbook.xlsx.writeBuffer();
}
