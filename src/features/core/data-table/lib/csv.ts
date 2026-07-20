const MAX_IMPORT_BYTES = 256 * 1024;

function escapeCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

export function rowsToCsv(
  headers: string[],
  rows: Record<string, unknown>[],
): string {
  const lines = [headers.map(escapeCell).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h])).join(","));
  }
  return lines.join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exceedsMaxImportBytes(text: string): boolean {
  return new TextEncoder().encode(text).length > MAX_IMPORT_BYTES;
}

/**
 * Scans the whole text as one quote-aware state machine, so `\n`/`\r\n` only
 * ends a record when it's outside an open quote — a real newline embedded in
 * a quoted field (which escapeCell/rowsToCsv produce on export) stays part of
 * that cell instead of splitting the row. Blank lines are dropped, matching
 * the previous line-split behavior.
 */
function parseCsvRecords(text: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;

  const pushCell = () => {
    row.push(cur);
    cur = "";
  };
  const pushRow = () => {
    pushCell();
    const isBlankLine = row.length === 1 && row[0] === "";
    if (!isBlankLine) records.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      pushCell();
    } else if (c === "\r") {
      if (text[i + 1] === "\n") i++;
      pushRow();
    } else if (c === "\n") {
      pushRow();
    } else {
      cur += c;
    }
  }
  if (cur !== "" || row.length > 0) {
    pushRow();
  }

  return records;
}

export function parseCsvToObjects(
  text: string,
): { headers: string[]; rows: Record<string, unknown>[] } | null {
  if (exceedsMaxImportBytes(text)) return null;
  const records = parseCsvRecords(text);
  const headers = records[0];
  if (headers === undefined) return null;
  const rows: Record<string, unknown>[] = [];
  for (const cells of records.slice(1)) {
    const o: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      o[h] = cells[i] ?? "";
    });
    rows.push(o);
  }
  return { headers, rows };
}

export function parseCsvPreview(
  text: string,
  maxRows = 8,
): { headers: string[]; rows: string[][] } | null {
  if (exceedsMaxImportBytes(text)) return null;
  const records = parseCsvRecords(text);
  const headers = records[0];
  if (headers === undefined) return null;
  const rows = records.slice(1, 1 + maxRows);
  return { headers, rows };
}
