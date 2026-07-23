import { TRPCError } from "@trpc/server";
import { describe, expect, test } from "vitest";
import {
  assertCanAddCourse,
  assertCanAddStudent,
  assertStorageBudget,
  PLAN_LIMITS,
} from "../src/features/core/organizations/server/limits";

// `ctx.t` only needs to satisfy the `(key) => string` shape these helpers
// actually call — a real i18n instance isn't needed to test the limit math.
const fakeCtx = { t: ((key: string) => key) as never };

const BYTES_PER_GB = 1024 * 1024 * 1024;

describe("assertCanAddStudent", () => {
  test("allows adding a student under the free plan's cap", () => {
    expect(() =>
      assertCanAddStudent(fakeCtx, { plan: "free", studentCount: 10 }),
    ).not.toThrow();
  });

  test("throws FORBIDDEN when adding a student would exceed the cap", () => {
    expect(() =>
      assertCanAddStudent(fakeCtx, { plan: "free", studentCount: 50 }),
    ).toThrow(TRPCError);
  });

  test("allows exactly reaching the cap", () => {
    expect(() =>
      assertCanAddStudent(fakeCtx, { plan: "free", studentCount: 49 }),
    ).not.toThrow();
  });

  test("never throws for enterprise (unlimited students)", () => {
    expect(() =>
      assertCanAddStudent(fakeCtx, { plan: "enterprise", studentCount: 1_000_000 }),
    ).not.toThrow();
  });

  test("respects a larger increment than 1", () => {
    expect(() =>
      assertCanAddStudent(fakeCtx, { plan: "free", studentCount: 45 }, 10),
    ).toThrow(TRPCError);
  });
});

describe("assertCanAddCourse", () => {
  test("allows adding a course under the free plan's cap", () => {
    expect(() =>
      assertCanAddCourse(fakeCtx, { plan: "free", courseCount: 4 }),
    ).not.toThrow();
  });

  test("throws FORBIDDEN when adding a course would exceed the cap", () => {
    expect(() =>
      assertCanAddCourse(fakeCtx, { plan: "free", courseCount: 5 }),
    ).toThrow(TRPCError);
  });

  test("never throws for enterprise (unlimited courses)", () => {
    expect(() =>
      assertCanAddCourse(fakeCtx, { plan: "enterprise", courseCount: 1_000_000 }),
    ).not.toThrow();
  });
});

describe("assertStorageBudget", () => {
  test("allows an upload within the free plan's 1 GB cap", () => {
    expect(() =>
      assertStorageBudget(
        fakeCtx,
        { plan: "free", storageBytes: 0 },
        BYTES_PER_GB / 2,
      ),
    ).not.toThrow();
  });

  test("throws FORBIDDEN when an upload would exceed the cap", () => {
    expect(() =>
      assertStorageBudget(
        fakeCtx,
        { plan: "free", storageBytes: BYTES_PER_GB - 100 },
        1_000,
      ),
    ).toThrow(TRPCError);
  });

  test("enterprise still has a storage cap, unlike students/courses", () => {
    expect(() =>
      assertStorageBudget(
        fakeCtx,
        { plan: "enterprise", storageBytes: PLAN_LIMITS.enterprise.maxStorageBytes },
        1,
      ),
    ).toThrow(TRPCError);
  });
});

describe("PLAN_LIMITS", () => {
  test("matches the plan limits documented in 00-product-spec.md", () => {
    expect(PLAN_LIMITS.free).toEqual({
      maxStudents: 50,
      maxCourses: 5,
      maxStorageBytes: 1 * BYTES_PER_GB,
    });
    expect(PLAN_LIMITS.basic).toEqual({
      maxStudents: 200,
      maxCourses: 25,
      maxStorageBytes: 10 * BYTES_PER_GB,
    });
    expect(PLAN_LIMITS.professional).toEqual({
      maxStudents: 1000,
      maxCourses: 100,
      maxStorageBytes: 50 * BYTES_PER_GB,
    });
    expect(PLAN_LIMITS.enterprise).toEqual({
      maxStudents: null,
      maxCourses: null,
      maxStorageBytes: 500 * BYTES_PER_GB,
    });
  });
});
