import { describe, expect, test } from "vitest";
import { googleFormSchema } from "../src/integrations/google/forms";

describe("googleFormSchema", () => {
  // proto3 JSON leaves default-valued fields out entirely, so a form whose
  // header title was left blank arrives with no `info.title` key at all.
  test("accepts a form whose title Google omitted", () => {
    const result = googleFormSchema.safeParse({
      formId: "form-1",
      info: { documentTitle: "Untitled form" },
      items: [],
    });

    expect(result.success).toBe(true);
    expect(result.data?.info.title).toBeUndefined();
  });

  test("still rejects a payload without a form id", () => {
    const result = googleFormSchema.safeParse({ info: { title: "Quiz" } });

    expect(result.success).toBe(false);
  });
});
