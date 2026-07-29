import { describe, expect, test } from "vitest";
import { mapHeaders, zodRowValidator } from "../src/features/core/import/lib";
import { reviewImportTable } from "../src/features/core/import/server/review";
import {
  type GroupStudentReferences,
  membershipKey,
  resolveGroupStudentRows,
} from "../src/features/system/learning-flow/groups/server/import-resolution";
import { groupStudentImportColumns } from "../src/features/system/learning-flow/groups/server/import-template";
import { groupStudentImportRowSchema } from "../src/features/system/learning-flow/groups/server/schemas";

const validate = zodRowValidator(groupStudentImportRowSchema);
const translateLabel = (key: string) => key;

const EN_HEADERS = ["Group", "Trainee email", "Trainee name"];
const AR_HEADERS = ["المجموعة", "بريد المتدرب", "اسم المتدرب"];

const SARA = "11111111-1111-4111-8111-111111111111";
const OMAR = "22222222-2222-4222-8222-222222222222";
const BEGINNERS = "33333333-3333-4333-8333-333333333333";

const references: GroupStudentReferences = {
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
  groupIdsByName: new Map([["beginners a", BEGINNERS]]),
  existingMemberships: new Set([membershipKey("beginners a", SARA)]),
};

function row(rowNumber: number, values: Record<string, string>) {
  const parsed = validate({
    groupName: "Beginners A",
    traineeEmail: "",
    traineeName: "",
    ...values,
  });
  if (!parsed.ok) throw new Error("fixture row must be valid");
  return { rowNumber, values, parsed: parsed.parsed };
}

describe("group assignments template headers", () => {
  test("matches the English template's own headers", () => {
    const mapping = mapHeaders(EN_HEADERS, groupStudentImportColumns);

    expect(mapping.columnIndexByKey).toEqual({
      groupName: 0,
      traineeEmail: 1,
      traineeName: 2,
    });
    expect(mapping.missingRequiredKeys).toEqual([]);
  });

  test("matches the Arabic template's headers, so a downloaded template round-trips", () => {
    const mapping = mapHeaders(AR_HEADERS, groupStudentImportColumns);

    expect(mapping.columnIndexByKey).toEqual({
      groupName: 0,
      traineeEmail: 1,
      traineeName: 2,
    });
  });

  test("reports a missing group column rather than guessing", () => {
    const result = reviewImportTable({
      table: { headers: ["Trainee email"], rows: [["sara@x.com"]] },
      columns: groupStudentImportColumns,
      validate,
      translateLabel,
    });

    expect(result).toEqual({
      ok: false,
      missingColumnLabels: ["import.groupStudents.columns.groupName"],
    });
  });
});

describe("resolveGroupStudentRows", () => {
  test("reports a trainee already on the roster as a match, not a new entry", () => {
    const result = resolveGroupStudentRows(
      { valid: [row(2, { traineeEmail: "sara@x.com" })], invalid: [] },
      references,
    );

    expect(result.actions).toEqual(["update"]);
  });

  test("adds a trainee who isn't on the roster yet", () => {
    const result = resolveGroupStudentRows(
      { valid: [row(2, { traineeEmail: "omar@x.com" })], invalid: [] },
      references,
    );

    expect(result.actions).toEqual(["create"]);
    expect(result.rowTargets.get(2)).toEqual({
      groupNameKey: "beginners a",
      groupName: "Beginners A",
      traineeId: OMAR,
    });
  });

  test("treats a group name the organization doesn't have as one to create, not an error", () => {
    const result = resolveGroupStudentRows(
      {
        valid: [row(2, { groupName: "Advanced B", traineeEmail: "omar@x.com" })],
        invalid: [],
      },
      references,
    );

    expect(result.actions).toEqual(["create"]);
    expect(result.rowTargets.get(2)?.groupNameKey).toBe("advanced b");
  });

  test("rejects a trainee this organization doesn't have", () => {
    const result = resolveGroupStudentRows(
      { valid: [row(2, { traineeEmail: "nobody@x.com" })], invalid: [] },
      references,
    );

    expect(result.valid).toEqual([]);
    expect(result.invalid[0].errors).toEqual([
      { column: "traineeEmail", message: "import.validation.unknownTrainee" },
    ]);
  });

  test("rejects a repeated group and trainee pair, even when the two rows name the trainee differently", () => {
    const result = resolveGroupStudentRows(
      {
        valid: [
          row(2, { traineeEmail: "omar@x.com" }),
          row(3, { traineeName: "Omar" }),
        ],
        invalid: [],
      },
      references,
    );

    expect(result.valid.map((entry) => entry.rowNumber)).toEqual([2]);
    expect(result.invalid[0].errors).toEqual([
      { column: "", message: "import.validation.duplicateMembership" },
    ]);
  });

  test("lets one trainee join two different groups in the same file", () => {
    const result = resolveGroupStudentRows(
      {
        valid: [
          row(2, { traineeEmail: "omar@x.com" }),
          row(3, { groupName: "Advanced B", traineeEmail: "omar@x.com" }),
        ],
        invalid: [],
      },
      references,
    );

    expect(result.valid.map((entry) => entry.rowNumber)).toEqual([2, 3]);
  });
});
