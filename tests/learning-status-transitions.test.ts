import { TRPCError } from "@trpc/server";
import { describe, expect, test } from "vitest";
import type { EnrollmentStatus, PlacementTestStatus } from "@/drizzle/schema";
import {
  allowedTransitions,
  assertValidTransition,
  ENROLLMENT_TRANSITIONS,
  isValidTransition,
  PLACEMENT_TEST_TRANSITIONS,
} from "@/features/system/learning-flow/status-transitions";

describe("ENROLLMENT_TRANSITIONS", () => {
  test.each([
    ["placementTest", "waiting"],
    ["placementTest", "cancelled"],
    ["waiting", "ongoing"],
    ["waiting", "postponed"],
    ["waiting", "cancelled"],
    ["ongoing", "completed"],
    ["ongoing", "postponed"],
    ["ongoing", "cancelled"],
    ["postponed", "ongoing"],
    ["postponed", "cancelled"],
  ] as [EnrollmentStatus, EnrollmentStatus][])(
    "allows %s -> %s",
    (from, to) => {
      expect(isValidTransition(ENROLLMENT_TRANSITIONS, from, to)).toBe(true);
    },
  );

  test.each([
    // Skipping the middle of the lifecycle: a trainee can't be completed
    // before any curriculum was delivered.
    ["placementTest", "ongoing"],
    ["placementTest", "completed"],
    ["waiting", "completed"],
    // A pause has to resume before it can finish.
    ["postponed", "completed"],
    // Nothing moves backwards.
    ["ongoing", "waiting"],
    ["completed", "ongoing"],
  ] as [EnrollmentStatus, EnrollmentStatus][])(
    "rejects %s -> %s",
    (from, to) => {
      expect(isValidTransition(ENROLLMENT_TRANSITIONS, from, to)).toBe(false);
    },
  );

  test.each(["completed", "cancelled"] as EnrollmentStatus[])(
    "%s is terminal",
    (status) => {
      expect(allowedTransitions(ENROLLMENT_TRANSITIONS, status)).toEqual([]);
    },
  );
});

describe("PLACEMENT_TEST_TRANSITIONS", () => {
  test.each([
    ["pending", "inProgress"],
    ["pending", "cancelled"],
    ["inProgress", "completed"],
    ["inProgress", "cancelled"],
  ] as [PlacementTestStatus, PlacementTestStatus][])(
    "allows %s -> %s",
    (from, to) => {
      expect(isValidTransition(PLACEMENT_TEST_TRANSITIONS, from, to)).toBe(
        true,
      );
    },
  );

  test.each([
    // A test can't be completed without an attempt behind it.
    ["pending", "completed"],
    ["completed", "inProgress"],
    ["cancelled", "inProgress"],
  ] as [PlacementTestStatus, PlacementTestStatus][])(
    "rejects %s -> %s",
    (from, to) => {
      expect(isValidTransition(PLACEMENT_TEST_TRANSITIONS, from, to)).toBe(
        false,
      );
    },
  );

  test.each(["completed", "cancelled"] as PlacementTestStatus[])(
    "%s is terminal",
    (status) => {
      expect(allowedTransitions(PLACEMENT_TEST_TRANSITIONS, status)).toEqual(
        [],
      );
    },
  );
});

describe("isValidTransition", () => {
  // A retried request must not fail just because the first one already
  // applied the status.
  test.each([
    "placementTest",
    "waiting",
    "ongoing",
    "postponed",
    "completed",
    "cancelled",
  ] as EnrollmentStatus[])("treats %s -> itself as a no-op", (status) => {
    expect(isValidTransition(ENROLLMENT_TRANSITIONS, status, status)).toBe(
      true,
    );
  });
});

describe("assertValidTransition", () => {
  test("returns silently for an allowed transition", () => {
    expect(() =>
      assertValidTransition(
        ENROLLMENT_TRANSITIONS,
        "waiting",
        "ongoing",
        "enrollments.invalidTransition",
      ),
    ).not.toThrow();
  });

  test("throws BAD_REQUEST carrying the caller's message", () => {
    try {
      assertValidTransition(
        ENROLLMENT_TRANSITIONS,
        "completed",
        "ongoing",
        "enrollments.invalidTransition",
      );
      expect.unreachable("expected a TRPCError");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("BAD_REQUEST");
      expect((error as TRPCError).message).toBe(
        "enrollments.invalidTransition",
      );
    }
  });
});
