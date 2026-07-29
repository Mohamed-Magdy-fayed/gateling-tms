import { describe, expect, test } from "vitest";
import { mapHeaders, zodRowValidator } from "../src/features/core/import/lib";
import { reviewImportTable } from "../src/features/core/import/server/review";
import {
  type ExistingLevels,
  levelKey,
  resolveLevelRows,
} from "../src/features/system/content-library/levels/server/import-resolution";
import { levelImportColumns } from "../src/features/system/content-library/levels/server/import-template";
import { levelImportRowSchema } from "../src/features/system/content-library/levels/server/schemas";

const validate = zodRowValidator(levelImportRowSchema);
const translateLabel = (key: string) => key;

const EN_HEADERS = ["Id", "Course", "Name", "Position"];
const AR_HEADERS = ["المعرّف", "الدورة", "الاسم", "الترتيب"];

const COURSE_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_COURSE_ID = "22222222-2222-4222-8222-222222222222";
const LEVEL_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_LEVEL_ID = "44444444-4444-4444-8444-444444444444";
const UNKNOWN_LEVEL_ID = "55555555-5555-4555-8555-555555555555";

const coursesByName = new Map([
  ["general english", COURSE_ID],
  ["phonics", OTHER_COURSE_ID],
]);

const existing: ExistingLevels = {
  byId: new Map([
    [LEVEL_ID, { id: LEVEL_ID, courseId: COURSE_ID }],
    [OTHER_LEVEL_ID, { id: OTHER_LEVEL_ID, courseId: OTHER_COURSE_ID }],
  ]),
  byCourseAndName: new Map([[levelKey(COURSE_ID, "Beginner"), LEVEL_ID]]),
};

function row(rowNumber: number, values: Record<string, string>) {
  const parsed = validate({
    id: "",
    courseName: "General English",
    name: "New level",
    order: "",
    ...values,
  });
  if (!parsed.ok) throw new Error("fixture row must be valid");
  return { rowNumber, values, parsed: parsed.parsed };
}

describe("levels template headers", () => {
  test("matches the English template's own headers", () => {
    const mapping = mapHeaders(EN_HEADERS, levelImportColumns);

    expect(mapping.columnIndexByKey).toEqual({
      id: 0,
      courseName: 1,
      name: 2,
      order: 3,
    });
    expect(mapping.missingRequiredKeys).toEqual([]);
  });

  test("matches the Arabic template's headers, so a downloaded template round-trips", () => {
    const mapping = mapHeaders(AR_HEADERS, levelImportColumns);

    expect(mapping.columnIndexByKey).toEqual({
      id: 0,
      courseName: 1,
      name: 2,
      order: 3,
    });
    expect(mapping.missingRequiredKeys).toEqual([]);
  });

  test("reports a missing course column rather than importing orphan levels", () => {
    const result = reviewImportTable({
      table: { headers: ["Name"], rows: [["Beginner"]] },
      columns: levelImportColumns,
      validate,
      translateLabel,
    });

    expect(result).toEqual({
      ok: false,
      missingColumnLabels: ["import.levels.columns.courseName"],
    });
  });
});

describe("levelImportRowSchema", () => {
  test("accepts a row without a position", () => {
    const result = validate({
      id: "",
      courseName: "General English",
      name: "Beginner",
      order: "",
    });

    expect(result.ok).toBe(true);
  });

  test("accepts a whole-number position", () => {
    const result = validate({
      id: "",
      courseName: "General English",
      name: "Beginner",
      order: "3",
    });

    expect(result).toEqual({
      ok: true,
      parsed: {
        id: "",
        courseName: "General English",
        name: "Beginner",
        order: "3",
      },
    });
  });

  test("rejects a position that isn't a whole number", () => {
    const result = validate({
      id: "",
      courseName: "General English",
      name: "Beginner",
      order: "1.5",
    });

    expect(result).toEqual({
      ok: false,
      errors: [{ column: "order", message: "import.validation.invalidOrder" }],
    });
  });

  test("requires a course name", () => {
    const result = validate({
      id: "",
      courseName: " ",
      name: "Beginner",
      order: "",
    });

    expect(result).toEqual({
      ok: false,
      errors: [{ column: "courseName", message: "forms.validation.required" }],
    });
  });
});

describe("resolveLevelRows", () => {
  test("matches an existing level by name within its own course, and creates otherwise", () => {
    const result = resolveLevelRows(
      {
        valid: [row(2, { name: "Beginner" }), row(3, { name: "Advanced" })],
        invalid: [],
      },
      coursesByName,
      existing,
    );

    expect(result.actions).toEqual(["update", "create"]);
    expect(result.targets).toEqual([LEVEL_ID, null]);
  });

  test("treats the same level name under a different course as a new level", () => {
    const result = resolveLevelRows(
      {
        valid: [row(2, { courseName: "Phonics", name: "Beginner" })],
        invalid: [],
      },
      coursesByName,
      existing,
    );

    expect(result.actions).toEqual(["create"]);
  });

  test("rejects a course this organization doesn't have instead of creating one", () => {
    const result = resolveLevelRows(
      { valid: [row(2, { courseName: "Business English" })], invalid: [] },
      coursesByName,
      existing,
    );

    expect(result.valid).toEqual([]);
    expect(result.invalid[0].errors).toEqual([
      { column: "courseName", message: "import.validation.unknownCourse" },
    ]);
  });

  test("rejects an id this organization doesn't have", () => {
    const result = resolveLevelRows(
      { valid: [row(2, { id: UNKNOWN_LEVEL_ID })], invalid: [] },
      coursesByName,
      existing,
    );

    expect(result.invalid[0].errors).toEqual([
      { column: "id", message: "import.validation.unknownLevelId" },
    ]);
  });

  test("rejects a row whose id belongs to a level under another course", () => {
    const result = resolveLevelRows(
      {
        valid: [row(2, { id: OTHER_LEVEL_ID, courseName: "General English" })],
        invalid: [],
      },
      coursesByName,
      existing,
    );

    expect(result.invalid[0].errors).toEqual([
      { column: "courseName", message: "import.validation.levelCourseMismatch" },
    ]);
  });

  test("rejects a second row targeting the level an earlier row claims", () => {
    const result = resolveLevelRows(
      {
        valid: [row(2, { id: LEVEL_ID }), row(3, { name: "Beginner" })],
        invalid: [],
      },
      coursesByName,
      existing,
    );

    expect(result.valid.map((entry) => entry.rowNumber)).toEqual([2]);
    expect(result.invalid[0].errors).toEqual([
      { column: "", message: "import.validation.duplicateLevel" },
    ]);
  });
});
