import { describe, expect, test } from "vitest";
import {
  formMutationSchema,
  formUpdateSchema,
} from "../src/features/system/assessments/forms/server/schemas";

describe("formMutationSchema", () => {
  test("accepts a standalone form with no attachment", () => {
    const result = formMutationSchema.safeParse({
      type: "placement",
      status: "draft",
      title: "Placement test",
    });
    expect(result.success).toBe(true);
  });

  test("accepts a form attached to a course/level/lecture chain", () => {
    const result = formMutationSchema.safeParse({
      type: "quiz",
      status: "draft",
      title: "Lesson quiz",
      courseId: "c1f2e3d4-5678-4abc-9def-0123456789ab",
      levelId: "c1f2e3d4-5678-4abc-9def-0123456789ac",
      lectureId: "c1f2e3d4-5678-4abc-9def-0123456789ad",
    });
    expect(result.success).toBe(true);
  });

  test("rejects a levelId without a courseId", () => {
    const result = formMutationSchema.safeParse({
      type: "quiz",
      status: "draft",
      title: "Lesson quiz",
      levelId: "c1f2e3d4-5678-4abc-9def-0123456789ac",
    });
    expect(result.success).toBe(false);
  });

  test("rejects a lectureId without a levelId", () => {
    const result = formMutationSchema.safeParse({
      type: "quiz",
      status: "draft",
      title: "Lesson quiz",
      courseId: "c1f2e3d4-5678-4abc-9def-0123456789ab",
      lectureId: "c1f2e3d4-5678-4abc-9def-0123456789ad",
    });
    expect(result.success).toBe(false);
  });

  test("rejects a blank title", () => {
    const result = formMutationSchema.safeParse({
      type: "assignment",
      status: "draft",
      title: "   ",
    });
    expect(result.success).toBe(false);
  });

  test("rejects an invalid type", () => {
    const result = formMutationSchema.safeParse({
      type: "essay",
      status: "draft",
      title: "Untitled",
    });
    expect(result.success).toBe(false);
  });

  test("treats an empty-string attachment as not attached", () => {
    const result = formMutationSchema.safeParse({
      type: "final",
      status: "draft",
      title: "Final exam",
      courseId: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.courseId).toBeNull();
    }
  });
});

describe("formUpdateSchema", () => {
  test("requires an id", () => {
    const result = formUpdateSchema.safeParse({
      type: "assignment",
      status: "draft",
      title: "Untitled",
    });
    expect(result.success).toBe(false);
  });
});
