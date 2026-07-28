import { describe, expect, test } from "vitest";
import {
  listPlacementTestsInput,
  placementTestAttemptSchema,
  placementTestMutationSchema,
  placementTestReviewSchema,
} from "@/features/system/learning-flow/placement-tests/server/schemas";
import { issueKeyAt } from "./test-utils";

const traineeId = "3f1c0a3e-2b7d-4a55-9c1e-0d2f4b6a8c10";
const formId = "7a2d5f18-9c34-4b6e-8f21-5d0c3a7b9e42";
const levelId = "b4e6c2a0-15d7-4f39-8a62-c9e1d3b5f708";
const questionId = "c8f3d1b6-4a29-4e07-9d5c-2b8e6f0a3c91";
const answerId = "e2a7b940-6c31-4d8f-a15b-73e9c2d4f806";

describe("placementTestMutationSchema", () => {
  test("accepts a test scheduled for a moment in time", () => {
    expect(
      placementTestMutationSchema.safeParse({
        traineeId,
        formId,
        scheduledAt: "2026-08-03T15:00:00.000Z",
      }).success,
    ).toBe(true);
  });

  // "Whenever" is a real answer — an academy often assigns the test before
  // booking the sitting.
  test("accepts a null scheduledAt", () => {
    expect(
      placementTestMutationSchema.safeParse({
        traineeId,
        formId,
        scheduledAt: null,
      }).success,
    ).toBe(true);
  });

  test("requires scheduledAt to be present, even if null", () => {
    expect(
      placementTestMutationSchema.safeParse({ traineeId, formId }).success,
    ).toBe(false);
  });

  test.each([
    ["a plain date", "2026-08-03"],
    ["an impossible instant", "2026-02-30T15:00:00.000Z"],
    ["free text", "next tuesday"],
  ])("rejects %s as scheduledAt", (_label, scheduledAt) => {
    expect(
      placementTestMutationSchema.safeParse({ traineeId, formId, scheduledAt })
        .success,
    ).toBe(false);
  });

  test("rejects a formId that isn't a uuid", () => {
    const result = placementTestMutationSchema.safeParse({
      traineeId,
      formId: "form-1",
      scheduledAt: null,
    });
    expect(result.success).toBe(false);
    expect(issueKeyAt(result, "formId")).toBe("forms.validation.required");
  });
});

describe("placementTestAttemptSchema", () => {
  test("accepts a choice answer", () => {
    expect(
      placementTestAttemptSchema.safeParse({
        id: traineeId,
        answers: [{ questionId, selectedAnswerIds: [answerId] }],
      }).success,
    ).toBe(true);
  });

  test("accepts a short-answer response", () => {
    expect(
      placementTestAttemptSchema.safeParse({
        id: traineeId,
        answers: [{ questionId, text: "Because it was raining." }],
      }).success,
    ).toBe(true);
  });

  // An empty submission would otherwise score zero and close the test as if
  // the trainee had actually sat it.
  test("rejects an empty answer list", () => {
    const result = placementTestAttemptSchema.safeParse({
      id: traineeId,
      answers: [],
    });
    expect(result.success).toBe(false);
    expect(issueKeyAt(result, "answers")).toBe("placementTests.unanswered");
  });

  test("rejects an answer whose text is over the limit", () => {
    const result = placementTestAttemptSchema.safeParse({
      id: traineeId,
      answers: [{ questionId, text: "x".repeat(2001) }],
    });
    expect(result.success).toBe(false);
    expect(issueKeyAt(result, "text")).toBe("forms.validation.max2000");
  });
});

describe("placementTestReviewSchema", () => {
  test("accepts a level with feedback", () => {
    expect(
      placementTestReviewSchema.safeParse({
        id: traineeId,
        assignedLevelId: levelId,
        feedback: "Strong reading, weaker on listening.",
      }).success,
    ).toBe(true);
  });

  test("accepts an empty feedback string", () => {
    expect(
      placementTestReviewSchema.safeParse({
        id: traineeId,
        assignedLevelId: levelId,
        feedback: "",
      }).success,
    ).toBe(true);
  });

  // Assigning a level is the whole point of the review — there is no
  // "reviewed but unplaced" outcome.
  test("requires an assigned level", () => {
    const result = placementTestReviewSchema.safeParse({
      id: traineeId,
      feedback: "",
    });
    expect(result.success).toBe(false);
    expect(issueKeyAt(result, "assignedLevelId")).toBe(
      "forms.validation.required",
    );
  });
});

describe("listPlacementTestsInput", () => {
  test("requires a trainee to scope to", () => {
    expect(listPlacementTestsInput.safeParse({}).success).toBe(false);
    expect(listPlacementTestsInput.safeParse({ traineeId }).success).toBe(true);
  });
});
