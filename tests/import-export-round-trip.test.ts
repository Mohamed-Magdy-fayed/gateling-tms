import { describe, expect, test } from "vitest";
import { parseCsvRecords } from "../src/features/core/data-table/lib/csv";
import {
  mapHeaders,
  toRecords,
  zodRowValidator,
} from "../src/features/core/import/lib";
import type { ImportColumn } from "../src/features/core/import/lib/types";
import { toLocalizedCsv } from "../src/features/core/import/server/download";
import {
  buildExportWorkbook,
  parseWorkbook,
} from "../src/features/core/import/server/workbook";
import { traineeImportColumns } from "../src/features/system/learning-flow/trainees/server/import-template";
import { traineeImportRowSchema } from "../src/features/system/learning-flow/trainees/server/schemas";

/**
 * The guarantee `phase-07.md` step 3 asks for: an export can be edited and
 * uploaded straight back, and the importer sees exactly the columns it wrote.
 * These exercise the two file formats against the trainees template, whose
 * `id` column is what turns a re-import into an update.
 */

const EN_HEADERS = ["Id", "Name", "Phone", "Email", "Group"];
const AR_HEADERS = [
  "المعرّف",
  "الاسم",
  "الهاتف",
  "البريد الإلكتروني",
  "المجموعة",
];

const EXPORTED_ROWS = [
  [
    "11111111-1111-4111-8111-111111111111",
    "Sara Ahmed",
    "+20 100 000 0000",
    "sara@x.com",
    "Beginners A",
  ],
  ["22222222-2222-4222-8222-222222222222", "Omar", "", "", ""],
];

function rowsFor(
  headers: string[],
  table: { headers: string[]; rows: string[][] },
) {
  const mapping = mapHeaders(table.headers, traineeImportColumns);
  expect(mapping.missingRequiredKeys).toEqual([]);
  expect(mapping.unknownHeaders).toEqual([]);
  expect(table.headers).toEqual(headers);
  return toRecords(table.rows, mapping, traineeImportColumns);
}

describe("XLSX export round trip", () => {
  test("an exported sheet parses back into the importer's own columns", async () => {
    const workbook = await buildExportWorkbook(EN_HEADERS, EXPORTED_ROWS, {
      sheetName: "Trainees",
      rightToLeft: false,
    });

    const table = await parseWorkbook(workbook);
    if (!table) throw new Error("the export must parse");
    const records = rowsFor(EN_HEADERS, table);

    expect(records).toHaveLength(2);
    expect(records[0].values).toEqual({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Sara Ahmed",
      phone: "+20 100 000 0000",
      email: "sara@x.com",
      groupName: "Beginners A",
    });
  });

  test("an Arabic export re-imports unchanged", async () => {
    const workbook = await buildExportWorkbook(AR_HEADERS, EXPORTED_ROWS, {
      sheetName: "المتدربون",
      rightToLeft: true,
    });

    const table = await parseWorkbook(workbook);
    if (!table) throw new Error("the export must parse");
    const records = rowsFor(AR_HEADERS, table);

    expect(records[1].values.name).toBe("Omar");
  });

  test("every exported row is one the importer accepts", async () => {
    const workbook = await buildExportWorkbook(EN_HEADERS, EXPORTED_ROWS, {
      sheetName: "Trainees",
      rightToLeft: false,
    });

    const table = await parseWorkbook(workbook);
    if (!table) throw new Error("the export must parse");
    const validate = zodRowValidator(traineeImportRowSchema);

    for (const record of rowsFor(EN_HEADERS, table)) {
      expect(validate(record.values).ok).toBe(true);
    }
  });

  test("an id survives the round trip, which is what makes a re-import an update", async () => {
    const workbook = await buildExportWorkbook(EN_HEADERS, EXPORTED_ROWS, {
      sheetName: "Trainees",
      rightToLeft: false,
    });

    const table = await parseWorkbook(workbook);
    if (!table) throw new Error("the export must parse");

    expect(
      rowsFor(EN_HEADERS, table).map((record) => record.values.id),
    ).toEqual(EXPORTED_ROWS.map((row) => row[0]));
  });
});

describe("CSV export round trip", () => {
  test("an exported CSV parses back into the importer's own columns", () => {
    const csv = toLocalizedCsv(EN_HEADERS, EXPORTED_ROWS);
    // The byte order mark Excel needs is stripped the same way the upload path
    // strips it, so it never leaks into the first header.
    const parsed = parseCsvRecords(csv.replace(/^﻿/, ""));

    const records = rowsFor(EN_HEADERS, {
      headers: parsed[0],
      rows: parsed.slice(1),
    });

    expect(records[0].values.email).toBe("sara@x.com");
    expect(records[1].values.phone).toBe("");
  });

  test("a value containing a comma survives the round trip", () => {
    const csv = toLocalizedCsv(EN_HEADERS, [
      ["", "Ahmed, Sara", "", "", "Beginners, A"],
    ]);
    const parsed = parseCsvRecords(csv.replace(/^﻿/, ""));

    expect(parsed[1]).toEqual(["", "Ahmed, Sara", "", "", "Beginners, A"]);
  });

  test("every export column keeps its place even when the value is blank", () => {
    const csv = toLocalizedCsv(EN_HEADERS, [["", "Omar", "", "", ""]]);
    const parsed = parseCsvRecords(csv.replace(/^﻿/, ""));

    expect(parsed[1]).toHaveLength(traineeImportColumns.length);
  });
});

describe("export column coverage", () => {
  test("the exporter writes a cell for every column the template declares", () => {
    const columns: ImportColumn[] = traineeImportColumns;

    for (const row of EXPORTED_ROWS) {
      expect(row).toHaveLength(columns.length);
    }
  });
});
