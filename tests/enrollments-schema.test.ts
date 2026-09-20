import { describe, expect, test } from "vitest";
import {
  enrollmentLevelStatusSchema,
  enrollmentMutationSchema,
  enrollmentStatusSchema,
  listEnrollmentsInput,
} from "@/features/system/students/enrollments/server/schemas";
import { issueKeyAt } from "./test-utils";

const traineeId = "3f1c0a3e-2b7d-4a55-9c1e-0d2f4b6a8c10";
const courseId = "7a2d5f18-9c34-4b6e-8f21-5d0c3a7b9e42";
const levelId = "b4e6c2a0-15d7-4f39-8a62-c9e1d3b5f708";

const emptyNewTrainee = { name: "", phone: "", email: "" };

const validEnrollment = {
  traineeMode: "existing" as const,
  traineeId,
  newTrainee: emptyNewTrainee,
  courseId,
  status: "waiting" as const,
};

const validNewTraineeEnrollment = {
  traineeMode: "new" as const,
  traineeId: "",
  newTrainee: { name: "Sara Adel", phone: "", email: "sara@example.com" },
  courseId,
  status: "waiting" as const,
};

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
    ["empty", ""],
    ["not a uuid", "trainee-1"],
  ])(
    "rejects a %s traineeId in existing mode with the required key",
    (_label, value) => {
      const result = enrollmentMutationSchema.safeParse({
        ...validEnrollment,
        traineeId: value,
      });
      expect(result.success).toBe(false);
      expect(issueKeyAt(result, "traineeId")).toBe("forms.validation.required");
    },
  );

  test("rejects a courseId that isn't a uuid", () => {
    const result = enrollmentMutationSchema.safeParse({
      ...validEnrollment,
      courseId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
    expect(issueKeyAt(result, "courseId")).toBe("forms.validation.required");
  });

  test("rejects a mode outside the enum", () => {
    expect(
      enrollmentMutationSchema.safeParse({
        ...validEnrollment,
        traineeMode: "lookup",
      }).success,
    ).toBe(false);
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
      enrollmentMutationSchema.safeParse({
        traineeMode: "existing",
        traineeId,
        courseId,
      }).success,
    ).toBe(false);
  });

  describe("new-student mode", () => {
    test("accepts a typed-in student with no traineeId", () => {
      expect(
        enrollmentMutationSchema.safeParse(validNewTraineeEnrollment).success,
      ).toBe(true);
    });

    test("requires the student's name", () => {
      const result = enrollmentMutationSchema.safeParse({
        ...validNewTraineeEnrollment,
        newTrainee: { ...validNewTraineeEnrollment.newTrainee, name: "   " },
      });
      expect(result.success).toBe(false);
      expect(issueKeyAt(result, "name")).toBe("forms.validation.required");
    });

    test("accepts a blank email but rejects a malformed one", () => {
      expect(
        enrollmentMutationSchema.safeParse({
          ...validNewTraineeEnrollment,
          newTrainee: { ...validNewTraineeEnrollment.newTrainee, email: "" },
        }).success,
      ).toBe(true);

      const result = enrollmentMutationSchema.safeParse({
        ...validNewTraineeEnrollment,
        newTrainee: {
          ...validNewTraineeEnrollment.newTrainee,
          email: "not-an-email",
        },
      });
      expect(result.success).toBe(false);
      expect(issueKeyAt(result, "email")).toBe("auth.validation.invalidEmail");
    });

    // Switching from "new" back to "existing" leaves whatever was typed in the
    // hidden fields; that leftover must never block the submit.
    test("ignores the unused branch in either mode", () => {
      expect(
        enrollmentMutationSchema.safeParse({
          ...validEnrollment,
          newTrainee: { name: "", phone: "", email: "garbage" },
        }).success,
      ).toBe(true);
      expect(
        enrollmentMutationSchema.safeParse({
          ...validNewTraineeEnrollment,
          traineeId: "not-a-uuid",
        }).success,
      ).toBe(true);
    });
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
