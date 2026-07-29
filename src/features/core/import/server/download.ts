import { rowsToCsv } from "@/features/core/data-table/lib/csv";

/**
 * Shared by the two file downloads the import feature serves: the blank
 * template and the organization's own rows in that template's shape.
 */

export const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const CSV_CONTENT_TYPE = "text/csv; charset=utf-8";

/** Makes Excel open a UTF-8 CSV as UTF-8 instead of the local code page. */
export const UTF8_BYTE_ORDER_MARK = "﻿";

export type DownloadFormat = "csv" | "xlsx";

/** XLSX unless the caller explicitly asks for CSV. */
export function resolveDownloadFormat(value: string | null): DownloadFormat {
  return value === "csv" ? "csv" : "xlsx";
}

/**
 * A CSV whose header row is the localized column labels and whose rows are
 * keyed by those same labels, which is what `rowsToCsv` expects.
 */
export function toLocalizedCsv(
  headers: string[],
  rows: string[][],
): string {
  const keyed = rows.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])),
  );

  return UTF8_BYTE_ORDER_MARK + rowsToCsv(headers, keyed);
}

export function fileResponse(
  body: string | ArrayBuffer,
  contentType: string,
  fileName: string,
): Response {
  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
