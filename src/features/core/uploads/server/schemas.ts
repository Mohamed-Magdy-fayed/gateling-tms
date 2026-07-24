import { z } from "zod";

// Base64 inflates raw bytes by 4/3 — mirrors
// integrations/firebase/storage.ts's own MAX_BASE64_LENGTH guard, checked
// again here so an oversized payload is rejected before it reaches the
// storage-budget check.
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_BASE64_LENGTH = Math.ceil(MAX_IMAGE_BYTES / 3) * 4;

export const uploadImageInput = z.object({
  base64: z.string().min(1).max(MAX_BASE64_LENGTH),
  mimeType: z.string().startsWith("image/"),
  folder: z.string().min(1).default("uploads"),
});

export const deleteImageInput = z.object({
  url: z.url(),
});

export type UploadImageInput = z.infer<typeof uploadImageInput>;
export type DeleteImageInput = z.infer<typeof deleteImageInput>;
