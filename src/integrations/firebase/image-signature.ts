/**
 * Does this byte sequence actually look like the image type it claims to be?
 *
 * The declared `mimeType` on an upload is caller-supplied — it comes from the
 * browser's `File.type`, which is inferred from the file extension and is
 * trivially forged. Without a check on the decoded bytes, arbitrary content
 * could be stored with `contentType: image/png` and then served from a
 * `storage.googleapis.com` URL the CSP's `img-src` trusts. This is what turns
 * the declared type from a claim into a fact.
 *
 * Pure and dependency-free so it can be tested directly, away from Firebase.
 */

type Signature = { offset: number; bytes: readonly number[] };

/**
 * The minimal distinguishing prefix per type. WebP and AVIF are container
 * formats whose brand sits after a length field, so their signatures are
 * matched at their own offsets rather than at byte 0.
 */
const SIGNATURES_BY_MIME: Record<string, readonly Signature[][]> = {
  "image/jpeg": [[{ offset: 0, bytes: [0xff, 0xd8, 0xff] }]],
  "image/png": [
    [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  ],
  "image/gif": [
    [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }], // GIF87a
    [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }], // GIF89a
  ],
  // "RIFF" ....(size).... "WEBP"
  "image/webp": [
    [
      { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
      { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
    ],
  ],
  // ISO-BMFF box: ....(size).... "ftypavif". `avis` is the animated brand.
  "image/avif": [
    [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66] }],
    [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x73] }],
  ],
};

function matchesAllParts(buffer: Uint8Array, parts: readonly Signature[]) {
  return parts.every(({ offset, bytes }) =>
    bytes.every((byte, index) => buffer[offset + index] === byte),
  );
}

/**
 * True when `buffer` carries a signature for `mimeType`. An unknown mime type
 * is always false — a type nobody wrote a signature for is a type this can't
 * vouch for, and the upload allowlist is the same five entries.
 */
export function matchesImageSignature(
  buffer: Uint8Array,
  mimeType: string,
): boolean {
  const alternatives = SIGNATURES_BY_MIME[mimeType];
  if (!alternatives) return false;

  return alternatives.some((parts) => matchesAllParts(buffer, parts));
}
