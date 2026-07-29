import { describe, expect, test } from "vitest";
import {
  MAX_IMPORT_BASE64_LENGTH,
  MAX_IMPORT_ROWS,
} from "../src/features/core/import/lib";
import { parseImportFile } from "../src/features/core/import/server/file";
import {
  buildTemplateWorkbook,
  cellText,
  parseWorkbook,
} from "../src/features/core/import/server/workbook";

function toBase64(text: string): string {
  return Buffer.from(text, "utf8").toString("base64");
}

describe("parseImportFile — CSV", () => {
  test("reads headers and rows", async () => {
    const result = await parseImportFile(
      "trainees.csv",
      toBase64("Name,Email\r\nSara,sara@x.com\r\nOmar,omar@x.com"),
    );

    expect(result).toEqual({
      ok: true,
      table: {
        headers: ["Name", "Email"],
        rows: [
          ["Sara", "sara@x.com"],
          ["Omar", "omar@x.com"],
        ],
      },
    });
  });

  test("strips the BOM Excel writes, so the first header still matches", async () => {
    const result = await parseImportFile(
      "trainees.csv",
      toBase64("﻿Name,Email\r\nSara,sara@x.com"),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.table.headers[0]).toBe("Name");
  });

  test("keeps a comma inside a quoted cell in one column", async () => {
    const result = await parseImportFile(
      "trainees.csv",
      toBase64('Name,Group\r\n"Ahmed, Sara",Beginners'),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.table.rows[0]).toEqual(["Ahmed, Sara", "Beginners"]);
  });

  test("rejects a header-only file as empty", async () => {
    const result = await parseImportFile(
      "trainees.csv",
      toBase64("Name,Email"),
    );

    expect(result).toEqual({ ok: false, problem: "empty" });
  });

  test("rejects more rows than one batch may hold", async () => {
    const rows = Array.from(
      { length: MAX_IMPORT_ROWS + 1 },
      (_, index) => `Student ${index}`,
    ).join("\r\n");
    const result = await parseImportFile(
      "trainees.csv",
      `${toBase64(`Name\r\n${rows}`)}`,
    );

    expect(result).toEqual({ ok: false, problem: "tooManyRows" });
  });
});

describe("parseImportFile — guards", () => {
  test("rejects a format it cannot read rather than guessing", async () => {
    const result = await parseImportFile("roster.pdf", toBase64("Name"));

    expect(result).toEqual({ ok: false, problem: "unsupportedFormat" });
  });

  test("rejects an oversized payload before decoding it", async () => {
    const result = await parseImportFile(
      "trainees.csv",
      "A".repeat(MAX_IMPORT_BASE64_LENGTH + 1),
    );

    expect(result).toEqual({ ok: false, problem: "tooLarge" });
  });
});

describe("cellText", () => {
  test("keeps a phone number Excel stored as a number", () => {
    expect(cellText(1000000000)).toBe("1000000000");
  });

  test("renders a date cell as an ISO date rather than a locale string", () => {
    expect(cellText(new Date("2026-03-01T00:00:00.000Z"))).toBe("2026-03-01");
  });

  test("flattens rich text into its visible characters", () => {
    expect(cellText({ richText: [{ text: "Sara " }, { text: "Ahmed" }] })).toBe(
      "Sara Ahmed",
    );
  });

  test("reads a formula's computed result", () => {
    expect(cellText({ formula: "A1&B1", result: "Sara Ahmed" })).toBe(
      "Sara Ahmed",
    );
  });

  test("treats a blank and an error cell alike — as no value", () => {
    expect(cellText(null)).toBe("");
    expect(cellText({ error: "#N/A" })).toBe("");
  });
});

describe("XLSX round trip", () => {
  test("a generated template parses back into the headers it was built from", async () => {
    const workbook = await buildTemplateWorkbook(
      [
        {
          label: "Name",
          required: true,
          example: "Sara Ahmed",
          hint: "Required.",
        },
        { label: "Email", required: false, example: "sara@x.com", hint: "" },
      ],
      {
        dataSheetName: "Trainees",
        referenceSheetName: "Reference",
        referenceHeaders: {
          column: "Column",
          required: "Required",
          notes: "Notes",
        },
        requiredYes: "Yes",
        requiredNo: "No",
        rightToLeft: false,
      },
    );

    const table = await parseWorkbook(workbook);

    expect(table).toEqual({
      headers: ["Name", "Email"],
      rows: [["Sara Ahmed", "sara@x.com"]],
    });
  });

  test("blank rows past the data are not counted as rows", async () => {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Trainees");
    sheet.addRow(["Name", "Email"]);
    sheet.addRow(["Sara", "sara@x.com"]);
    // A sheet whose used range outgrew its data — ordinary in real files, and
    // it must not inflate the count checked against MAX_IMPORT_ROWS.
    sheet.addRow(["", ""]);
    sheet.addRow(["", ""]);

    const table = await parseWorkbook(await workbook.xlsx.writeBuffer());

    expect(table?.rows).toEqual([["Sara", "sara@x.com"]]);
  });

  test("the reference sheet is not mistaken for data", async () => {
    const workbook = await buildTemplateWorkbook(
      [{ label: "Name", required: true, example: "Sara", hint: "Required." }],
      {
        dataSheetName: "Trainees",
        referenceSheetName: "Reference",
        referenceHeaders: {
          column: "Column",
          required: "Required",
          notes: "Notes",
        },
        requiredYes: "Yes",
        requiredNo: "No",
        rightToLeft: false,
      },
    );

    const table = await parseWorkbook(workbook);

    expect(table?.rows).toEqual([["Sara"]]);
  });
});
