import { describe, expect, test } from "vitest";
import {
  showcaseConsentSchema,
  testimonialSubmitSchema,
} from "../src/features/marketing/testimonials/server/schemas";
import { issueKeyAt } from "./test-utils";

const validSubmission = {
  quote: "Scheduling stopped being a spreadsheet problem.",
  authorName: "Sara Ahmed",
  isPublic: false,
};

describe("testimonialSubmitSchema", () => {
  test("accepts a quote and name with consent withheld", () => {
    const result = testimonialSubmitSchema.safeParse(validSubmission);
    expect(result.success).toBe(true);
  });

  test("accepts an optional role, image and consent", () => {
    const result = testimonialSubmitSchema.safeParse({
      ...validSubmission,
      authorRole: "Founder",
      imageUrl: "https://storage.example.com/orgs/1/testimonials/a.png",
      isPublic: true,
    });
    expect(result.success).toBe(true);
  });

  test("treats a cleared role and image as empty, not invalid", () => {
    const result = testimonialSubmitSchema.safeParse({
      ...validSubmission,
      authorRole: "",
      imageUrl: "",
    });
    expect(result.success).toBe(true);
  });

  test("rejects a blank quote", () => {
    const result = testimonialSubmitSchema.safeParse({
      ...validSubmission,
      quote: "   ",
    });
    expect(issueKeyAt(result, "quote")).toBe("forms.validation.required");
  });

  test("rejects a quote over 1024 characters", () => {
    const result = testimonialSubmitSchema.safeParse({
      ...validSubmission,
      quote: "a".repeat(1025),
    });
    expect(issueKeyAt(result, "quote")).toBe("forms.validation.max1024");
  });

  test("rejects a blank display name", () => {
    const result = testimonialSubmitSchema.safeParse({
      ...validSubmission,
      authorName: "",
    });
    expect(issueKeyAt(result, "authorName")).toBe("forms.validation.required");
  });

  test("rejects a display name over 128 characters", () => {
    const result = testimonialSubmitSchema.safeParse({
      ...validSubmission,
      authorName: "a".repeat(129),
    });
    expect(issueKeyAt(result, "authorName")).toBe("forms.validation.max128");
  });

  test("rejects a non-URL image value", () => {
    const result = testimonialSubmitSchema.safeParse({
      ...validSubmission,
      imageUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  // Consent is the gate on publication, so "unspecified" must not be a state
  // the server can receive and quietly interpret.
  test("rejects a submission with no consent decision at all", () => {
    const result = testimonialSubmitSchema.safeParse({
      quote: validSubmission.quote,
      authorName: validSubmission.authorName,
    });
    expect(result.success).toBe(false);
  });

  test("trims the quote and name before validation", () => {
    const result = testimonialSubmitSchema.safeParse({
      ...validSubmission,
      quote: "  Trimmed quote.  ",
      authorName: "  Sara Ahmed  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quote).toBe("Trimmed quote.");
      expect(result.data.authorName).toBe("Sara Ahmed");
    }
  });
});

describe("showcaseConsentSchema", () => {
  test("accepts both consent states", () => {
    expect(showcaseConsentSchema.safeParse({ consented: true }).success).toBe(
      true,
    );
    expect(showcaseConsentSchema.safeParse({ consented: false }).success).toBe(
      true,
    );
  });

  test("rejects a missing decision", () => {
    expect(showcaseConsentSchema.safeParse({}).success).toBe(false);
  });
});
