import { describe, expect, test } from "vitest";
import { mapHeaders, zodRowValidator } from "../src/features/core/import/lib";
import { reviewImportTable } from "../src/features/core/import/server/review";
import {
  type ExistingEnrollments,
  enrollmentPairKey,
  type ImportReferences,
  resolveEnrollmentRows,
} from "../src/features/system/learning-flow/enrollments/server/import-resolution";
import { enrollmentImportColumns } from "../src/features/system/learning-flow/enrollments/server/import-template";
import { enrollmentImportRowSchema } from "../src/features/system/learning-flow/enrollments/server/schemas";

const validate = zodRowValidator(enrollmentImportRowSchema);
const translateLabel = (key: string) => key;

const EN_HEADERS = ["Id", "Trainee email", "Trainee name", "Course", "Status"];
const AR_HEADERS = [
  "المعرّف",
  "بريد المتدرب",
  "اسم المتدرب",
  "الدورة",
  "الحالة",
];

const SARA = "11111111-1111-4111-8111-111111111111";
const OMAR = "22222222-2222-4222-8222-222222222222";
const ENGLISH = "33333333-3333-4333-8333-333333333333";
const PHONICS = "44444444-4444-4444-8444-444444444444";
const ENROLLMENT = "55555555-5555-4555-8555-555555555555";
const UNKNOWN = "66666666-6666-4666-8666-666666666666";

const references: ImportReferences = {
  trainees: {
    byEmail: new Map([
      ["sara@x.com", SARA],
      ["omar@x.com", OMAR],
    ]),
    idsByName: new Map([
      ["sara ahmed", [SARA]],
      ["omar", [OMAR]],
    ]),
  },
  coursesByName: new Map([
    ["general english", ENGLISH],
    ["phonics", PHONICS],
  ]),
};

/** Sara is already enrolled in General English and waiting to start. */
const existing: ExistingEnrollments = {
  byId: new Map([
    [
      ENROLLMENT,
      {
        id: ENROLLMENT,
        traineeId: SARA,
        courseId: ENGLISH,
        status: "waiting" as const,
      },
    ],
  ]),
  activeByPair: new Map([
    [
      enrollmentPairKey(SARA, ENGLISH),
      {
        id: ENROLLMENT,
        traineeId: SARA,
        courseId: ENGLISH,
        status: "waiting" as const,
      },
    ],
  ]),
};

function row(rowNumber: number, values: Record<string, string>) {
  const parsed = validate({
    id: "",
    traineeEmail: "",
    traineeName: "",
    courseName: "General English",
    status: "",
    ...values,
  });
  if (!parsed.ok) throw new Error("fixture row must be valid");
  return { rowNumber, values, parsed: parsed.parsed };
}

describe("enrollments template headers", () => {
  test("matches the English template's own headers", () => {
    expect(mapHeaders(EN_HEADERS, enrollmentImportColumns).missingRequiredKeys)
      .toEqual([]);
  });

  test("matches the Arabic template's headers, so a downloaded template round-trips", () => {
    const mapping = mapHeaders(AR_HEADERS, enrollmentImportColumns);

    expect(mapping.columnIndexByKey).toEqual({
      id: 0,
      traineeEmail: 1,
      traineeName: 2,
      courseName: 3,
      status: 4,
    });
  });

  test("reports a missing course column rather than guessing", () => {
    const result = reviewImportTable({
      table: { headers: ["Trainee email"], rows: [["sara@x.com"]] },
      columns: enrollmentImportColumns,
      validate,
      translateLabel,
    });

    expect(result).toEqual({
      ok: false,
      missingColumnLabels: ["import.enrollments.columns.courseName"],
    });
  });
});

describe("enrollmentImportRowSchema", () => {
  test("accepts a blank status", () => {
    const result = validate({
      id: "",
      traineeEmail: "sara@x.com",
      traineeName: "",
      courseName: "General English",
      status: "",
    });

    expect(result.ok).toBe(true);
  });

  test("rejects a status that isn't one of the lifecycle's own", () => {
    const result = validate({
      id: "",
      traineeEmail: "sara@x.com",
      traineeName: "",
      courseName: "General English",
      status: "graduated",
    });

    expect(result).toEqual({
      ok: false,
      errors: [{ column: "status", message: "import.validation.invalidStatus" }],
    });
  });
});

describe("resolveEnrollmentRows", () => {
  test("updates the trainee's live enrollment rather than creating a second one", () => {
    const result = resolveEnrollmentRows(
      {
        valid: [row(2, { traineeEmail: "sara@x.com", status: "ongoing" })],
        invalid: [],
      },
      references,
      existing,
    );

    expect(result.actions).toEqual(["update"]);
    expect(result.targets).toEqual([ENROLLMENT]);
  });

  test("creates when the trainee has no live enrollment in that course", () => {
    const result = resolveEnrollmentRows(
      {
        valid: [row(2, { traineeEmail: "omar@x.com" })],
        invalid: [],
      },
      references,
      existing,
    );

    expect(result.actions).toEqual(["create"]);
    expect(result.rowTargets.get(2)).toEqual({
      traineeId: OMAR,
      courseId: ENGLISH,
      status: null,
    });
  });

  test("rejects a status the enrollment's lifecycle can't reach from where it is", () => {
    const result = resolveEnrollmentRows(
      {
        valid: [row(2, { traineeEmail: "sara@x.com", status: "completed" })],
        invalid: [],
      },
      references,
      existing,
    );

    expect(result.valid).toEqual([]);
    expect(result.invalid[0].errors).toEqual([
      { column: "status", message: "import.validation.invalidTransition" },
    ]);
  });

  test("allows re-stating the status an enrollment already has", () => {
    const result = resolveEnrollmentRows(
      {
        valid: [row(2, { traineeEmail: "sara@x.com", status: "waiting" })],
        invalid: [],
      },
      references,
      existing,
    );

    expect(result.actions).toEqual(["update"]);
  });

  test("rejects a course this organization doesn't have instead of creating one", () => {
    const result = resolveEnrollmentRows(
      {
        valid: [
          row(2, { traineeEmail: "sara@x.com", courseName: "Business" }),
        ],
        invalid: [],
      },
      references,
      existing,
    );

    expect(result.invalid[0].errors).toEqual([
      { column: "courseName", message: "import.validation.unknownCourse" },
    ]);
  });

  test("rejects a trainee this organization doesn't have instead of creating one", () => {
    const result = resolveEnrollmentRows(
      { valid: [row(2, { traineeEmail: "nobody@x.com" })], invalid: [] },
      references,
      existing,
    );

    expect(result.invalid[0].errors).toEqual([
      { column: "traineeEmail", message: "import.validation.unknownTrainee" },
    ]);
  });

  test("rejects a second row for the same trainee and course, even when the two name the trainee differently", () => {
    const result = resolveEnrollmentRows(
      {
        valid: [
          row(2, { traineeEmail: "omar@x.com", courseName: "Phonics" }),
          row(3, { traineeName: "Omar", courseName: "Phonics" }),
        ],
        invalid: [],
      },
      references,
      existing,
    );

    expect(result.valid.map((entry) => entry.rowNumber)).toEqual([2]);
    expect(result.invalid[0].errors).toEqual([
      { column: "", message: "import.validation.duplicateEnrollment" },
    ]);
  });

  test("rejects an id this organization doesn't have", () => {
    const result = resolveEnrollmentRows(
      {
        valid: [row(2, { id: UNKNOWN, traineeEmail: "sara@x.com" })],
        invalid: [],
      },
      references,
      existing,
    );

    expect(result.invalid[0].errors).toEqual([
      { column: "id", message: "import.validation.unknownEnrollmentId" },
    ]);
  });

  test("rejects an id pointed at a different trainee or course", () => {
    const result = resolveEnrollmentRows(
      {
        valid: [row(2, { id: ENROLLMENT, traineeEmail: "omar@x.com" })],
        invalid: [],
      },
      references,
      existing,
    );

    expect(result.invalid[0].errors).toEqual([
      { column: "id", message: "import.validation.enrollmentMismatch" },
    ]);
  });
});
