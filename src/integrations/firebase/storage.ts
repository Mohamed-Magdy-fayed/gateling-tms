import "server-only";

import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { getStorageBucket } from "./admin";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
// Base64 inflates raw bytes by 4/3 — reject oversized/malformed input by
// length and charset *before* decoding, so an oversized request can't force
// a large allocation ahead of the post-decode size check.
const MAX_BASE64_LENGTH = Math.ceil(MAX_IMAGE_BYTES / 3) * 4;
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

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
 * Returns the public download URL and the exact decoded byte count (the
 * server already has to decode + validate the buffer, so returning its real
 * length here is free — callers charging `organizations.storageBytes`
 * should use this, not re-estimate from the base64 string length).
 *
 * @param base64 - base64 string (no data URI prefix)
 * @param mimeType - MIME type of the image
 * @param folder - storage folder path (e.g. "orgs/{organizationId}/lectures")
 */
export async function uploadImage(
  base64: string,
  mimeType: string,
  folder = "uploads",
): Promise<{ url: string; bytes: number }> {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Unsupported image type",
    });
  }

  if (
    !base64 ||
    base64.length > MAX_BASE64_LENGTH ||
    !BASE64_PATTERN.test(base64)
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Image exceeds the maximum allowed size (8MB) or is not valid base64",
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

  return { url: file.publicUrl(), bytes: buffer.length };
}

/**
 * Delete an image from Firebase Storage given its public URL. Never throws —
 * callers can fire-and-forget — but only a confirmed "already gone" (404) is
 * treated as success; permission, config, and network failures are logged
 * server-side instead of being silently swallowed.
 *
 * Returns the freed byte count (0 if the URL didn't belong to this bucket,
 * the object was already gone, or its size couldn't be read) so callers can
 * refund `organizations.storageBytes` with the object's *actual* size
 * rather than an estimate that could drift from what was really charged at
 * upload time.
 */
export async function deleteImage(publicUrl: string): Promise<number> {
  const bucket = getStorageBucket();
  const bucketName = bucket.name;
  const prefix = `https://storage.googleapis.com/${bucketName}/`;

  if (!publicUrl.startsWith(prefix)) return 0;

  const filePath = decodeURIComponent(publicUrl.slice(prefix.length));
  const file = bucket.file(filePath);

  try {
    const [metadata] = await file.getMetadata();
    const size = Number(metadata.size ?? 0);

    await file.delete();

    return Number.isFinite(size) ? size : 0;
  } catch (err) {
    const code = (err as { code?: number } | undefined)?.code;
    if (code === 404) return 0; // already deleted — not an error

    console.error("Failed to delete Firebase Storage object:", filePath, err);
    return 0;
  }
}
