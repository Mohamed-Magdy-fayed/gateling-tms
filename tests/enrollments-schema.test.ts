import { describe, expect, test } from "vitest";
import {
  enrollmentLevelStatusSchema,
  enrollmentMutationSchema,
  enrollmentStatusSchema,
  listEnrollmentsInput,
} from "@/features/system/learning-flow/enrollments/server/schemas";

const traineeId = "3f1c0a3e-2b7d-4a55-9c1e-0d2f4b6a8c10";
const courseId = "7a2d5f18-9c34-4b6e-8f21-5d0c3a7b9e42";
const levelId = "b4e6c2a0-15d7-4f39-8a62-c9e1d3b5f708";

const validEnrollment = {
  traineeId,
  courseId,
  status: "waiting" as const,
};

/** The translation key a failed parse reported for `path`, if any. */
function issueKeyAt(
  result: { success: boolean; error?: { issues: readonly unknown[] } },
  path: string,
): string | undefined {
  if (result.success || !result.error) return undefined;
  const issue = result.error.issues.find(
    (
      candidate,
    ): candidate is { path: (string | number)[]; message: string } => {
      const typed = candidate as { path?: (string | number)[] };
      return typed.path?.at(-1) === path;
    },
  );
  return issue?.message;
}

describe("enrollmentMutationSchema", () => {
  test("accepts a well-formed enrollment", () => {
    expect(enrollmentMutationSchema.safeParse(validEnrollment).success).toBe(
      true,
    );
  });

  test.each([
    "placementTest",
    "waiting",
    "ongoing",
    "completed",
    "cancelled",
    "postponed",
  ])("accepts %s as a starting status", (status) => {
    expect(
      enrollmentMutationSchema.safeParse({ ...validEnrollment, status })
        .success,
    ).toBe(true);
  });

  test("rejects a status outside the enum", () => {
    expect(
      enrollmentMutationSchema.safeParse({
        ...validEnrollment,
        status: "graduated",
      }).success,
    ).toBe(false);
  });

  test.each([
    ["missing", undefined],
    ["empty", ""],
    ["not a uuid", "trainee-1"],
  ])("rejects a %s traineeId with the required key", (_label, value) => {
    const result = enrollmentMutationSchema.safeParse({
      ...validEnrollment,
      traineeId: value,
    });
    expect(result.success).toBe(false);
    expect(issueKeyAt(result, "traineeId")).toBe("forms.validation.required");
  });

  test("rejects a courseId that isn't a uuid", () => {
    const result = enrollmentMutationSchema.safeParse({
      ...validEnrollment,
      courseId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
    expect(issueKeyAt(result, "courseId")).toBe("forms.validation.required");
  });

  /**
   * The client form shares this schema with the server, and TanStack Form
   * requires the validator's input and output types to match exactly — a
   * `.default()` or `.transform()` breaks that equality (STATE.md D82). Parsing
   * an object with nothing omitted and nothing rewritten is what proves neither
   * has been reintroduced.
   */
  test("neither defaults nor transforms its input", () => {
    const result = enrollmentMutationSchema.safeParse(validEnrollment);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(validEnrollment);
    expect(
      enrollmentMutationSchema.safeParse({ traineeId, courseId }).success,
    ).toBe(false);
  });
});

describe("enrollmentStatusSchema", () => {
  test("accepts an id and a status", () => {
    expect(
      enrollmentStatusSchema.safeParse({
        id: traineeId,
        status: "ongoing",
      }).success,
    ).toBe(true);
  });

  // Trainee and course are the enrollment's identity — an edit that could move
  // either would rewrite history rather than correct it.
  test("ignores attempts to move the enrollment to another trainee", () => {
    const result = enrollmentStatusSchema.safeParse({
      id: traineeId,
      status: "ongoing",
      traineeId: courseId,
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: traineeId, status: "ongoing" });
  });
});

describe("enrollmentLevelStatusSchema", () => {
  test.each(["notStarted", "inProgress", "completed"])(
    "accepts %s",
    (status) => {
      expect(
        enrollmentLevelStatusSchema.safeParse({
          enrollmentId: traineeId,
          levelId,
          status,
        }).success,
      ).toBe(true);
    },
  );

  test("rejects a status outside the enum", () => {
    expect(
      enrollmentLevelStatusSchema.safeParse({
        enrollmentId: traineeId,
        levelId,
        status: "skipped",
      }).success,
    ).toBe(false);
  });
});

describe("listEnrollmentsInput", () => {
  test("defaults paging when the client sends nothing", () => {
    const result = listEnrollmentsInput.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ page: 1, perPage: 20, sorting: [] });
  });

  test("accepts the trainee and status filters the detail page sends", () => {
    const result = listEnrollmentsInput.safeParse({
      traineeId,
      status: "ongoing",
    });
    expect(result.success).toBe(true);
    expect(result.data?.traineeId).toBe(traineeId);
  });

  test("rejects a perPage above the cap", () => {
    expect(listEnrollmentsInput.safeParse({ perPage: 500 }).success).toBe(
      false,
    );
  });
});
