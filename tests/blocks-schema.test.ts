import { describe, expect, test } from "vitest";
import { blockMutationSchema } from "../src/features/system/assessments/blocks/server/schemas";

describe("blockMutationSchema", () => {
  const sectionId = "c1f2e3d4-5678-4abc-9def-0123456789ab";

  const base = {
    sectionId,
    kind: "text" as const,
    title: "",
    body: "",
    mediaUrl: "",
    mediaAlt: "",
  };

  test("accepts a text block with a body", () => {
    const result = blockMutationSchema.safeParse({
      ...base,
      body: "Read the passage below, then answer the questions.",
    });
    expect(result.success).toBe(true);
  });

  test("accepts a text block that is only a heading", () => {
    const result = blockMutationSchema.safeParse({
      ...base,
      title: "Part two",
    });
    expect(result.success).toBe(true);
  });

  test("accepts an image block with a URL", () => {
    const result = blockMutationSchema.safeParse({
      ...base,
      kind: "image",
      mediaUrl: "https://storage.googleapis.com/bucket/orgs/1/diagram.png",
      mediaAlt: "A right-angled triangle",
    });
    expect(result.success).toBe(true);
  });

  test("accepts a video block with a URL", () => {
    const result = blockMutationSchema.safeParse({
      ...base,
      kind: "video",
      mediaUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    });
    expect(result.success).toBe(true);
  });

  // An empty block renders as a gap the author can't see and the respondent
  // can't act on, so it is refused rather than stored.
  test("rejects a text block with neither heading nor body", () => {
    expect(blockMutationSchema.safeParse(base).success).toBe(false);
  });

  test("rejects a media block with no URL", () => {
    const result = blockMutationSchema.safeParse({
      ...base,
      kind: "image",
      title: "A heading is not enough for an image",
    });
    expect(result.success).toBe(false);
  });

  test("rejects a media URL that isn't a URL", () => {
    const result = blockMutationSchema.safeParse({
      ...base,
      kind: "video",
      mediaUrl: "youtube.com/watch",
    });
    expect(result.success).toBe(false);
  });

  test("rejects an unknown kind", () => {
    const result = blockMutationSchema.safeParse({
      ...base,
      kind: "audio",
      mediaUrl: "https://example.com/clip.mp3",
    });
    expect(result.success).toBe(false);
  });
});
