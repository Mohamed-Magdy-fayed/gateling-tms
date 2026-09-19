import { describe, expect, test } from "vitest";
import {
  traineeNoteMutationSchema,
  traineeNoteUpdateSchema,
} from "../src/features/system/students/notes/server/schemas";

const TRAINEE = "11111111-1111-4111-8111-111111111111";
const NOTE = "22222222-2222-4222-8222-222222222222";

describe("traineeNoteMutationSchema", () => {
  test("accepts a note with a body", () => {
    const result = traineeNoteMutationSchema.safeParse({
      traineeId: TRAINEE,
      body: "Called about the missed class; will rejoin next week.",
    });
    expect(result.success).toBe(true);
  });

  test("trims the body before validation", () => {
    const result = traineeNoteMutationSchema.safeParse({
      traineeId: TRAINEE,
      body: "  Prefers evening sessions.  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body).toBe("Prefers evening sessions.");
    }
  });

  test("rejects a blank body with the required message key", () => {
    const result = traineeNoteMutationSchema.safeParse({
      traineeId: TRAINEE,
      body: "   ",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "body");
      expect(issue?.message).toBe("forms.validation.required");
    }
  });

  test("rejects a body over 4000 characters with the matching message key", () => {
    const result = traineeNoteMutationSchema.safeParse({
      traineeId: TRAINEE,
      body: "a".repeat(4001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "body");
      expect(issue?.message).toBe("forms.validation.max4000");
    }
  });

  test("rejects a trainee id that is not a uuid", () => {
    const result = traineeNoteMutationSchema.safeParse({
      traineeId: "not-an-id",
      body: "Hello",
    });
    expect(result.success).toBe(false);
  });
});

describe("traineeNoteUpdateSchema", () => {
  test("takes the note id and a body, not the trainee", () => {
    const result = traineeNoteUpdateSchema.safeParse({
      id: NOTE,
      body: "Edited",
    });
    expect(result.success).toBe(true);
  });

  test("rejects a missing id", () => {
    const result = traineeNoteUpdateSchema.safeParse({ body: "Edited" });
    expect(result.success).toBe(false);
  });
});
