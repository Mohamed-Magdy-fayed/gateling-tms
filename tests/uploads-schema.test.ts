import { describe, expect, test } from "vitest";
import {
  deleteImageInput,
  uploadImageInput,
} from "../src/features/core/uploads/server/schemas";

describe("uploadImageInput", () => {
  test("accepts a valid image payload", () => {
    const result = uploadImageInput.safeParse({
      base64: "aGVsbG8=",
      mimeType: "image/png",
      folder: "courses",
    });
    expect(result.success).toBe(true);
  });

  test("defaults folder to 'uploads' when omitted", () => {
    const result = uploadImageInput.safeParse({
      base64: "aGVsbG8=",
      mimeType: "image/png",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.folder).toBe("uploads");
    }
  });

  test("rejects a non-image mimeType", () => {
    const result = uploadImageInput.safeParse({
      base64: "aGVsbG8=",
      mimeType: "application/pdf",
      folder: "courses",
    });
    expect(result.success).toBe(false);
  });

  test("rejects an empty base64 string", () => {
    const result = uploadImageInput.safeParse({
      base64: "",
      mimeType: "image/png",
    });
    expect(result.success).toBe(false);
  });

  test("rejects a base64 string over the 8MB-equivalent length cap", () => {
    const result = uploadImageInput.safeParse({
      base64: "a".repeat(12_000_000),
      mimeType: "image/png",
    });
    expect(result.success).toBe(false);
  });
});

describe("deleteImageInput", () => {
  test("accepts a valid URL", () => {
    const result = deleteImageInput.safeParse({
      url: "https://storage.googleapis.com/bucket/orgs/org-1/courses/thumb.jpg",
    });
    expect(result.success).toBe(true);
  });

  test("rejects a non-URL string", () => {
    const result = deleteImageInput.safeParse({ url: "not-a-url" });
    expect(result.success).toBe(false);
  });
});
