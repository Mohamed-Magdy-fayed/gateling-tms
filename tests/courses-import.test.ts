import { describe, expect, test } from "vitest";
import { mapHeaders, zodRowValidator } from "../src/features/core/import/lib";
import {
  capacityCutoff,
  reviewImportTable,
} from "../src/features/core/import/server/review";
import {
  courseNameKey,
  resolveCourseRows,
} from "../src/features/system/content-library/courses/server/import-resolution";
import { courseImportColumns } from "../src/features/system/content-library/courses/server/import-template";
import { courseImportRowSchema } from "../src/features/system/content-library/courses/server/schemas";

const validate = zodRowValidator(courseImportRowSchema);
const translateLabel = (key: string) => key;

const EN_HEADERS = ["Id", "Name", "Description"];
const AR_HEADERS = ["المعرّف", "الاسم", "الوصف"];

const COURSE_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "22222222-2222-4222-8222-222222222222";

const existing = {
  byId: new Map([[COURSE_ID, COURSE_ID]]),
  byName: new Map([["general english", COURSE_ID]]),
};

function row(rowNumber: number, values: Record<string, string>) {
  const parsed = validate({
    id: "",
    name: "New course",
    description: "",
    ...values,
  });
  if (!parsed.ok) throw new Error("fixture row must be valid");
  return { rowNumber, values, parsed: parsed.parsed };
}

describe("courses template headers", () => {
  test("matches the English template's own headers", () => {
    const mapping = mapHeaders(EN_HEADERS, courseImportColumns);

    expect(mapping.columnIndexByKey).toEqual({
      id: 0,
      name: 1,
      description: 2,
    });
    expect(mapping.missingRequiredKeys).toEqual([]);
  });

  test("matches the Arabic template's headers, so a downloaded template round-trips", () => {
    const mapping = mapHeaders(AR_HEADERS, courseImportColumns);

    expect(mapping.columnIndexByKey).toEqual({
      id: 0,
      name: 1,
      description: 2,
    });
    expect(mapping.missingRequiredKeys).toEqual([]);
  });

  test("reports the missing required column rather than guessing", () => {
    const result = reviewImportTable({
      table: { headers: ["Id", "Description"], rows: [["", "Some text"]] },
      columns: courseImportColumns,
      validate,
      translateLabel,
    });

    expect(result).toEqual({
      ok: false,
      missingColumnLabels: ["import.courses.columns.name"],
    });
  });
});

describe("courseImportRowSchema", () => {
  test("accepts a row with only a name", () => {
    expect(validate({ id: "", name: "Phonics", description: "" })).toEqual({
      ok: true,
      parsed: { id: "", name: "Phonics", description: "" },
    });
  });

  test("requires a name", () => {
    const result = validate({ id: "", name: "  ", description: "" });

    expect(result).toEqual({
      ok: false,
      errors: [{ column: "name", message: "forms.validation.required" }],
    });
  });

  test("reads a whitespace-only id as not given", () => {
    const result = validate({ id: " ", name: "Phonics", description: "" });

    expect(result).toEqual({
      ok: true,
      parsed: { id: "", name: "Phonics", description: "" },
    });
  });

  test("rejects an id that isn't an identifier", () => {
    const result = validate({ id: "course-1", name: "Phonics", description: "" });

    expect(result).toEqual({
      ok: false,
      errors: [{ column: "id", message: "import.validation.invalidId" }],
    });
  });
});

describe("courseNameKey", () => {
  test("matches case-insensitively, so a re-typed name finds the same course", () => {
    expect(courseNameKey("  General English ")).toBe("general english");
  });
});

describe("resolveCourseRows", () => {
  test("matches by id, then by name, and creates otherwise", () => {
    const result = resolveCourseRows(
      {
        valid: [
          row(2, { id: COURSE_ID }),
          row(3, { name: "general english" }),
          row(4, { name: "Phonics" }),
        ],
        invalid: [],
      },
      existing,
    );

    // Row 3 targets the same course as row 2 and is rejected below; the point
    // here is that a name match resolves to an update, not a create.
    expect(result.actions[0]).toBe("update");
    expect(result.actions.at(-1)).toBe("create");
  });

  test("rejects an id this organization doesn't have", () => {
    const result = resolveCourseRows(
      { valid: [row(2, { id: OTHER_ID })], invalid: [] },
      existing,
    );

    expect(result.valid).toEqual([]);
    expect(result.invalid[0].errors).toEqual([
      { column: "id", message: "import.validation.unknownCourseId" },
    ]);
  });

  test("rejects a second row targeting the course an earlier row claims, even by a different column", () => {
    const result = resolveCourseRows(
      {
        valid: [row(2, { id: COURSE_ID }), row(3, { name: "General English" })],
        invalid: [],
      },
      existing,
    );

    expect(result.valid.map((entry) => entry.rowNumber)).toEqual([2]);
    expect(result.invalid).toEqual([
      {
        rowNumber: 3,
        values: expect.anything(),
        errors: [{ column: "", message: "import.validation.duplicateCourse" }],
      },
    ]);
  });

  test("keeps the file's row order when rows are rejected", () => {
    const result = resolveCourseRows(
      {
        valid: [row(2, { id: OTHER_ID }), row(3, {}), row(4, { id: OTHER_ID })],
        invalid: [],
      },
      existing,
    );

    expect(result.invalid.map((entry) => entry.rowNumber)).toEqual([2, 4]);
    expect(result.valid.map((entry) => entry.rowNumber)).toEqual([3]);
  });
});

describe("course plan capacity", () => {
  test("cuts a batch of new courses at the free plan's remaining room", () => {
    expect(capacityCutoff(["create", "create", "create"], 2)).toBe(2);
  });

  test("lets updates through even when the course limit is reached", () => {
    expect(capacityCutoff(["update", "update"], 0)).toBe(2);
  });
});
