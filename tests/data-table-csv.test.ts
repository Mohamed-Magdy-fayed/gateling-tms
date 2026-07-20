import { describe, expect, test } from "vitest";
import {
  parseCsvToObjects,
  rowsToCsv,
} from "../src/features/core/data-table/lib/csv";

describe("CSV export/import round-trip", () => {
  test("preserves a field containing an embedded newline", () => {
    const headers = ["name", "notes"];
    const rows = [{ name: "Alpha", notes: "line one\nline two" }];

    const csv = rowsToCsv(headers, rows);
    const parsed = parseCsvToObjects(csv);

    expect(parsed?.rows).toEqual([
      { name: "Alpha", notes: "line one\nline two" },
    ]);
  });

  test("drops genuinely blank lines", () => {
    const parsed = parseCsvToObjects(
      "name,notes\r\nAlpha,hi\r\n\r\nBeta,bye\r\n",
    );

    expect(parsed?.rows).toEqual([
      { name: "Alpha", notes: "hi" },
      { name: "Beta", notes: "bye" },
    ]);
  });

  test("rejects input over the byte limit measured in UTF-8, not UTF-16 code units", () => {
    // Each "é" is 1 UTF-16 code unit but 2 UTF-8 bytes — a string just under
    // the byte cap in code-unit count can still exceed it in real bytes.
    const big = "é".repeat(140_000);
    expect(parseCsvToObjects(`name\n${big}`)).toBeNull();
  });
});
