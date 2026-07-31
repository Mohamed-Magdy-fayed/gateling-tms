import { z } from "zod";

// Base64 inflates raw bytes by 4/3 — mirrors
// integrations/firebase/storage.ts's own MAX_BASE64_LENGTH guard, checked
// again here so an oversized payload is rejected before it reaches the
// storage-budget check.
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_BASE64_LENGTH = Math.ceil(MAX_IMAGE_BYTES / 3) * 4;

/**
 * The same set `integrations/firebase/storage.ts` enforces, stated here too so
 * an unsupported type is rejected at the boundary with a field error instead of
 * travelling through the org lookup and the storage-budget check to fail deeper
 * in. `startsWith("image/")` used to be the only check here, which accepted
 * types (`image/svg+xml` above all — an SVG is a script container) that the
 * storage layer would then refuse anyway.
 */
export const ALLOWED_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export type AllowedUploadMimeType = (typeof ALLOWED_UPLOAD_MIME_TYPES)[number];

/** Narrows a browser-supplied `File.type`, which is just a string. */
export function isAllowedUploadMimeType(
  mimeType: string,
): mimeType is AllowedUploadMimeType {
  return (ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(mimeType);
}

export const uploadImageInput = z.object({
  base64: z.string().min(1).max(MAX_BASE64_LENGTH),
  mimeType: z.enum(ALLOWED_UPLOAD_MIME_TYPES),
  folder: z.string().min(1).default("uploads"),
});

export const deleteImageInput = z.object({
  url: z.url(),
});

export type UploadImageInput = z.infer<typeof uploadImageInput>;
export type DeleteImageInput = z.infer<typeof deleteImageInput>;
