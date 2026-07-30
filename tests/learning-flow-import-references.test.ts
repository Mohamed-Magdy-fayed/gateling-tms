import { describe, expect, test } from "vitest";
import {
  distinctNames,
  lookupTraineeId,
  matchKey,
  optionalMatchKey,
  type TraineeDirectory,
} from "../src/features/system/learning-flow/import-reference-keys";

const SARA = "11111111-1111-4111-8111-111111111111";
const OMAR = "22222222-2222-4222-8222-222222222222";
const OTHER_OMAR = "33333333-3333-4333-8333-333333333333";

const directory: TraineeDirectory = {
  byEmail: new Map([["sara@x.com", SARA]]),
  idsByName: new Map([
    ["sara ahmed", [SARA]],
    ["omar", [OMAR, OTHER_OMAR]],
  ]),
};

describe("match keys", () => {
  test("ignores case and padding, so a re-typed value still matches", () => {
    expect(matchKey("  Sara@X.com ")).toBe("sara@x.com");
  });

  test("reads a blank cell as not given rather than as an empty match", () => {
    expect(optionalMatchKey("   ")).toBeNull();
    expect(optionalMatchKey("Beginners A")).toBe("beginners a");
  });
});

describe("distinctNames", () => {
  test("keeps one spelling per name and drops blanks", () => {
    expect(
      distinctNames(["Beginners A", "beginners a", "", "  ", "Advanced"]),
    ).toEqual(["Beginners A", "Advanced"]);
  });
});

describe("lookupTraineeId", () => {
  test("prefers the email when both columns are filled", () => {
    expect(lookupTraineeId("sara@x.com", "Omar", directory)).toEqual({
      traineeId: SARA,
    });
  });

  test("falls back to a name when no email is given", () => {
    expect(lookupTraineeId("", "Sara Ahmed", directory)).toEqual({
      traineeId: SARA,
    });
  });

  test("refuses a name two trainees share instead of guessing", () => {
    expect(lookupTraineeId("", "Omar", directory)).toEqual({
      rejected: {
        column: "traineeName",
        message: "import.validation.ambiguousTrainee",
      },
    });
  });

  test("rejects an email the organization doesn't have, without falling back to the name", () => {
    expect(lookupTraineeId("nobody@x.com", "Sara Ahmed", directory)).toEqual({
      rejected: {
        column: "traineeEmail",
        message: "import.validation.unknownTrainee",
      },
    });
  });

  test("rejects an unknown name", () => {
    expect(lookupTraineeId("", "Nobody", directory)).toEqual({
      rejected: {
        column: "traineeName",
        message: "import.validation.unknownTrainee",
      },
    });
  });

  test("asks for one of the two columns when the row names nobody", () => {
    expect(lookupTraineeId("", "  ", directory)).toEqual({
      rejected: {
        column: "traineeName",
        message: "import.validation.traineeRequired",
      },
    });
  });
});
