import { describe, expect, test } from "vitest";
import { questionMutationSchema } from "../src/features/system/assessments/questions/server/schemas";

describe("questionMutationSchema", () => {
  const sectionId = "c1f2e3d4-5678-4abc-9def-0123456789ab";

  /**
   * Every field is sent on every request, including the empty ones: the schema
   * is shared with TanStack Form, which needs its input and output types to
   * match exactly, so an unset optional is `""`/`false` rather than absent.
   */
  const base = {
    sectionId,
    text: "What is 2 + 2?",
    description: "",
    type: "single_choice" as const,
    points: 1,
    isRequired: false,
    imageUrl: "",
    imageAlt: "",
  };

  test("accepts a valid single-choice question", () => {
    expect(questionMutationSchema.safeParse(base).success).toBe(true);
  });

  test("accepts a short-answer question", () => {
    const result = questionMutationSchema.safeParse({
      ...base,
      text: "Explain your reasoning.",
      type: "short_answer",
      points: 5,
    });
    expect(result.success).toBe(true);
  });

  test.each(["long_answer", "date", "time"] as const)(
    "accepts a %s question",
    (type) => {
      expect(questionMutationSchema.safeParse({ ...base, type }).success).toBe(
        true,
      );
    },
  );

  test("accepts help text, a required flag and an image", () => {
    const result = questionMutationSchema.safeParse({
      ...base,
      description: "Use the diagram above.",
      isRequired: true,
      imageUrl: "https://storage.googleapis.com/bucket/orgs/1/diagram.png",
      imageAlt: "A right-angled triangle",
    });
    expect(result.success).toBe(true);
  });

  test("rejects an image field that isn't a URL", () => {
    const result = questionMutationSchema.safeParse({
      ...base,
      imageUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  // These parse as absolute URLs, so `z.url()` alone lets them through — and
  // the answer sheet renders `imageUrl` straight into an `src` attribute.
  test.each(["javascript:alert(1)", "data:text/html,<script>alert(1)</script>"])(
    "rejects the executable scheme %s",
    (imageUrl) => {
      expect(
        questionMutationSchema.safeParse({ ...base, imageUrl }).success,
      ).toBe(false);
    },
  );

  test("rejects a blank question text", () => {
    const result = questionMutationSchema.safeParse({ ...base, text: "   " });
    expect(result.success).toBe(false);
  });

  test("rejects an invalid question type", () => {
    const result = questionMutationSchema.safeParse({ ...base, type: "essay" });
    expect(result.success).toBe(false);
  });

  test("rejects negative points", () => {
    const result = questionMutationSchema.safeParse({ ...base, points: -1 });
    expect(result.success).toBe(false);
  });
});
