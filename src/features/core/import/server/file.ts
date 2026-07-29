import { parseCsvRecords } from "@/features/core/data-table/lib/csv";
import {
  MAX_IMPORT_BASE64_LENGTH,
  MAX_IMPORT_FILE_BYTES,
  MAX_IMPORT_ROWS,
} from "../lib/limits";
import { parseWorkbook, type WorkbookTable } from "./workbook";

export type ImportFileProblem =
  | "tooLarge"
  | "unsupportedFormat"
  | "empty"
  | "tooManyRows";

export type ParseImportFileResult =
  | { ok: true; table: WorkbookTable }
  | { ok: false; problem: ImportFileProblem };

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

/** Excel writes CSV with a UTF-8 BOM, which would corrupt the first header. */
function stripByteOrderMark(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * exceljs reads an `ArrayBuffer`, and a Node `Buffer` is a view into a pooled
 * one — copying out its own bytes is the only way to hand over exactly this
 * file's contents.
 */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

function toTable(records: string[][]): WorkbookTable | null {
  const headers = records[0];
  if (headers === undefined) return null;
  return { headers, rows: records.slice(1) };
}

/**
 * Decodes an uploaded template and reads it as a header row plus data rows.
 * Problems come back as codes rather than thrown errors so the caller can map
 * them to localized messages — this module has no locale of its own.
 */
export async function parseImportFile(
  fileName: string,
  base64: string,
): Promise<ParseImportFileResult> {
  if (base64.length > MAX_IMPORT_BASE64_LENGTH) {
    return { ok: false, problem: "tooLarge" };
  }

  const buffer = Buffer.from(base64, "base64");
  if (buffer.byteLength > MAX_IMPORT_FILE_BYTES) {
    return { ok: false, problem: "tooLarge" };
  }

  const extension = extensionOf(fileName);
  let table: WorkbookTable | null;

  if (extension === "csv") {
    table = toTable(
      parseCsvRecords(stripByteOrderMark(buffer.toString("utf8"))),
    );
  } else if (extension === "xlsx") {
    table = await parseWorkbook(toArrayBuffer(buffer));
  } else {
    return { ok: false, problem: "unsupportedFormat" };
  }

  if (table === null || table.rows.length === 0) {
    return { ok: false, problem: "empty" };
  }
  if (table.rows.length > MAX_IMPORT_ROWS) {
    return { ok: false, problem: "tooManyRows" };
  }

  return { ok: true, table };
}
