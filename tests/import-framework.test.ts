import { describe, expect, test } from "vitest";
import {
  flagDuplicateRows,
  mapHeaders,
  normalizeHeader,
  type ReviewedRows,
  reviewRows,
  toRecords,
  zodRowValidator,
} from "../src/features/core/import/lib";
import type { ImportColumn } from "../src/features/core/import/lib/types";
import {
  capacityCutoff,
  reviewImportTable,
} from "../src/features/core/import/server/review";
import { resolveRows } from "../src/features/system/learning-flow/trainees/server/import-resolution";
import { traineeImportColumns } from "../src/features/system/learning-flow/trainees/server/import-template";
import { traineeImportRowSchema } from "../src/features/system/learning-flow/trainees/server/schemas";

const columns: ImportColumn[] = traineeImportColumns;
const validate = zodRowValidator(traineeImportRowSchema);
const translateLabel = (key: string) => key;

const EN_HEADERS = ["Id", "Name", "Phone", "Email", "Group"];

describe("normalizeHeader", () => {
  test("ignores case, padding, colons and asterisks a spreadsheet adds", () => {
    expect(normalizeHeader("  Name*: ")).toBe("name");
    expect(normalizeHeader("GROUP")).toBe("group");
  });

  test("collapses runs of whitespace, including the non-breaking space", () => {
    expect(normalizeHeader("full  name")).toBe("full name");
  });
});

describe("mapHeaders", () => {
  test("matches the English template's own headers", () => {
    const mapping = mapHeaders(EN_HEADERS, columns);

    expect(mapping.columnIndexByKey).toEqual({
      id: 0,
      name: 1,
      phone: 2,
      email: 3,
      groupName: 4,
    });
    expect(mapping.missingRequiredKeys).toEqual([]);
    expect(mapping.unknownHeaders).toEqual([]);
  });

  test("matches the Arabic template's headers, so an AR export re-imports", () => {
    const mapping = mapHeaders(
      ["المعرّف", "الاسم", "الهاتف", "البريد الإلكتروني", "المجموعة"],
      columns,
    );

    expect(mapping.columnIndexByKey.name).toBe(1);
    expect(mapping.columnIndexByKey.groupName).toBe(4);
    expect(mapping.missingRequiredKeys).toEqual([]);
  });

  test("matches canonical keys, so a hand-built file works too", () => {
    const mapping = mapHeaders(["groupName", "name"], columns);

    expect(mapping.columnIndexByKey).toEqual({ groupName: 0, name: 1 });
  });

  test("reports a missing required column instead of guessing", () => {
    const mapping = mapHeaders(["Email", "Phone"], columns);

    expect(mapping.missingRequiredKeys).toEqual(["name"]);
  });

  test("reports headers it could not place", () => {
    const mapping = mapHeaders(["Name", "Nickname"], columns);

    expect(mapping.unknownHeaders).toEqual(["Nickname"]);
    expect(mapping.missingRequiredKeys).toEqual([]);
  });

  test("keeps the first of two identical headers", () => {
    const mapping = mapHeaders(["Name", "Name"], columns);

    expect(mapping.columnIndexByKey.name).toBe(0);
  });
});

describe("toRecords", () => {
  const mapping = mapHeaders(EN_HEADERS, columns);

  test("numbers rows the way the user's spreadsheet does", () => {
    const records = toRecords(
      [
        ["", "Sara", "", "", ""],
        ["", "Omar", "", "", ""],
      ],
      mapping,
      columns,
    );

    expect(records.map((record) => record.rowNumber)).toEqual([2, 3]);
  });

  test("drops trailing blank rows rather than reporting them as invalid", () => {
    const records = toRecords(
      [["", "Sara", "", "", ""], ["", "", "", "", ""], []],
      mapping,
      columns,
    );

    expect(records).toHaveLength(1);
  });

  test("fills absent columns with an empty string", () => {
    const partial = mapHeaders(["Name"], columns);
    const records = toRecords([["Sara"]], partial, columns);

    expect(records[0].values).toEqual({
      id: "",
      name: "Sara",
      phone: "",
      email: "",
      groupName: "",
    });
  });
});

describe("zodRowValidator over the trainees row schema", () => {
  const base = { id: "", name: "Sara", phone: "", email: "", groupName: "" };

  test("accepts a name-only row — the minimum the promise allows", () => {
    const result = validate(base);

    expect(result).toEqual({ ok: true, parsed: base });
  });

  test("reports the offending column, keyed by translation key", () => {
    const result = validate({ ...base, name: "", email: "not-an-email" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual(
      expect.arrayContaining([
        { column: "name", message: "forms.validation.required" },
        { column: "email", message: "auth.validation.invalidEmail" },
      ]),
    );
  });

  test("rejects an id that isn't an identifier at all", () => {
    const result = validate({ ...base, id: "42" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toEqual({
      column: "id",
      message: "import.validation.invalidId",
    });
  });
});

describe("flagDuplicateRows", () => {
  function reviewed(emails: string[]): ReviewedRows<{ email: string }> {
    return {
      valid: emails.map((email, index) => ({
        rowNumber: index + 2,
        values: { email },
        parsed: { email },
      })),
      invalid: [],
    };
  }

  const error = {
    column: "email",
    message: "import.validation.duplicateEmail",
  };

  test("keeps the first occurrence and rejects the later one", () => {
    const result = flagDuplicateRows(
      reviewed(["sara@x.com", "omar@x.com", "sara@x.com"]),
      (row) => row.parsed.email,
      error,
    );

    expect(result.valid.map((row) => row.rowNumber)).toEqual([2, 3]);
    expect(result.invalid).toEqual([
      { rowNumber: 4, values: { email: "sara@x.com" }, errors: [error] },
    ]);
  });

  test("treats a blank identity as not comparable", () => {
    const result = flagDuplicateRows(
      reviewed(["", ""]),
      (row) => row.parsed.email || null,
      error,
    );

    expect(result.valid).toHaveLength(2);
    expect(result.invalid).toEqual([]);
  });

  test("returns invalid rows in file order", () => {
    const start = reviewRows(
      [
        { rowNumber: 5, values: { name: "" } },
        { rowNumber: 6, values: { name: "Sara" } },
        { rowNumber: 7, values: { name: "Sara" } },
      ],
      (values) =>
        values.name === ""
          ? { ok: false, errors: [{ column: "name", message: "required" }] }
          : { ok: true, parsed: { name: values.name } },
    );

    const result = flagDuplicateRows(start, (row) => row.parsed.name, error);

    expect(result.invalid.map((row) => row.rowNumber)).toEqual([5, 7]);
  });
});

describe("reviewImportTable", () => {
  test("stops on a missing required column and names it", () => {
    const result = reviewImportTable({
      table: { headers: ["Email"], rows: [["sara@x.com"]] },
      columns,
      validate,
      translateLabel,
    });

    expect(result).toEqual({
      ok: false,
      missingColumnLabels: ["import.trainees.columns.name"],
    });
  });

  test("separates valid rows from explained invalid ones", () => {
    const result = reviewImportTable({
      table: {
        headers: EN_HEADERS,
        rows: [
          ["", "Sara", "0100", "sara@x.com", "Beginners A"],
          ["", "", "", "nope", ""],
        ],
      },
      columns,
      validate,
      translateLabel,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.totalRows).toBe(2);
    expect(result.reviewed.valid).toHaveLength(1);
    expect(result.reviewed.invalid[0].rowNumber).toBe(3);
  });
});

describe("the trainees row schema's whitespace handling", () => {
  const base = { id: "", name: "Sara", phone: "", email: "", groupName: "" };

  test("reads a whitespace-only id as 'not given', not as invalid", () => {
    const result = validate({ ...base, id: "   " });

    expect(result).toEqual({ ok: true, parsed: { ...base, id: "" } });
  });

  test("reads a whitespace-only email the same way", () => {
    const result = validate({ ...base, email: " " });

    expect(result).toEqual({ ok: true, parsed: { ...base, email: "" } });
  });
});

describe("resolveRows", () => {
  const TRAINEE_ID = "11111111-1111-4111-8111-111111111111";
  const existing = {
    byId: new Map([[TRAINEE_ID, TRAINEE_ID]]),
    byEmail: new Map([["sara@x.com", TRAINEE_ID]]),
  };

  function row(rowNumber: number, values: Record<string, string>) {
    const parsed = validate({
      id: "",
      name: "Sara",
      phone: "",
      email: "",
      groupName: "",
      ...values,
    });
    if (!parsed.ok) throw new Error("fixture row must be valid");
    return { rowNumber, values, parsed: parsed.parsed };
  }

  test("matches by id, then by email, and creates otherwise", () => {
    const result = resolveRows(
      {
        valid: [
          row(2, { id: TRAINEE_ID }),
          row(3, { email: "omar@x.com" }),
          row(4, {}),
        ],
        invalid: [],
      },
      existing,
    );

    expect(result.actions).toEqual(["update", "create", "create"]);
  });

  test("rejects an id this organization doesn't have", () => {
    const result = resolveRows(
      {
        valid: [row(2, { id: "22222222-2222-4222-8222-222222222222" })],
        invalid: [],
      },
      existing,
    );

    expect(result.valid).toEqual([]);
    expect(result.invalid[0].errors).toEqual([
      { column: "id", message: "import.validation.unknownId" },
    ]);
  });

  test("rejects a second row targeting the trainee an earlier row claims, even by a different column", () => {
    const result = resolveRows(
      {
        valid: [row(2, { id: TRAINEE_ID }), row(3, { email: "sara@x.com" })],
        invalid: [],
      },
      existing,
    );

    expect(result.valid.map((entry) => entry.rowNumber)).toEqual([2]);
    expect(result.invalid).toEqual([
      {
        rowNumber: 3,
        values: expect.anything(),
        errors: [{ column: "", message: "import.validation.duplicateTrainee" }],
      },
    ]);
  });
});

describe("capacityCutoff", () => {
  test("imports everything when the plan is unlimited", () => {
    expect(capacityCutoff(["create", "create", "create"], null)).toBe(3);
  });

  test("cuts the file where the plan runs out", () => {
    expect(capacityCutoff(["create", "create", "create"], 2)).toBe(2);
  });

  test("does not charge capacity for rows that update an existing record", () => {
    expect(capacityCutoff(["update", "update", "create", "update"], 1)).toBe(4);
  });

  test("stops before the first create when the plan is already full", () => {
    expect(capacityCutoff(["update", "create", "update"], 0)).toBe(1);
  });
});
