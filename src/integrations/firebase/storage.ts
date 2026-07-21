import "server-only";

import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { getStorageBucket } from "./admin";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

/**
 * Storage path convention once org-scoped uploads land (Phase 4, AD-6):
 * `orgs/{organizationId}/{folder}/...` — every caller passes a
 * `folder` prefixed with the owning org's id so per-org byte accounting for
 * the 1 GB cap can walk a single prefix. Dormant until then: these helpers
 * compile and accept any `folder` string, they just aren't called yet.
 *
 * Uploads go through a tRPC mutation as base64 (no signed-URL/CORS path —
 * not needed at this app's expected image sizes).
 */

/**
 * Upload a base64-encoded image to Firebase Storage.
 * Returns the public download URL.
 *
 * @param base64 - base64 string (no data URI prefix)
 * @param mimeType - MIME type of the image
 * @param folder - storage folder path (e.g. "orgs/{organizationId}/lectures")
 */
export async function uploadImage(
  base64: string,
  mimeType: string,
  folder = "uploads",
): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Unsupported image type",
    });
  }

  const buffer = Buffer.from(base64, "base64");

  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Image exceeds the maximum allowed size (8MB)",
    });
  }

  const extension = EXTENSION_BY_MIME[mimeType] ?? ".jpg";
  const filename = `${folder}/${Date.now()}-${randomUUID()}${extension}`;

  const bucket = getStorageBucket();
  const file = bucket.file(filename);

  await file.save(buffer, {
    metadata: { contentType: mimeType },
    public: true,
  });

  return file.publicUrl();
}

/**
 * Delete an image from Firebase Storage given its public URL.
 * Silently ignores errors (file already deleted, wrong bucket, etc.)
 */
export async function deleteImage(publicUrl: string): Promise<void> {
  try {
    const bucket = getStorageBucket();
    const bucketName = bucket.name;
    const prefix = `https://storage.googleapis.com/${bucketName}/`;

    if (!publicUrl.startsWith(prefix)) return;

    const filePath = decodeURIComponent(publicUrl.slice(prefix.length));
    await bucket.file(filePath).delete();
  } catch {
    // Ignore failures — image already deleted or wrong URL format
  }
}
