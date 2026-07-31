import { describe, expect, test } from "vitest";
import { matchesImageSignature } from "../src/integrations/firebase/image-signature";

const bytes = (...values: number[]) => Uint8Array.from(values);
const ascii = (text: string) =>
  Uint8Array.from(text, (char) => char.charCodeAt(0));

function concat(...parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00);
const GIF87 = ascii("GIF87a....");
const GIF89 = ascii("GIF89a....");
const WEBP = concat(ascii("RIFF"), bytes(0x20, 0, 0, 0), ascii("WEBPVP8 "));
const AVIF = concat(bytes(0, 0, 0, 0x20), ascii("ftypavif"), ascii("...."));
const AVIF_SEQUENCE = concat(
  bytes(0, 0, 0, 0x20),
  ascii("ftypavis"),
  ascii("...."),
);

describe("matchesImageSignature", () => {
  test("accepts each allowed type's real signature", () => {
    expect(matchesImageSignature(JPEG, "image/jpeg")).toBe(true);
    expect(matchesImageSignature(PNG, "image/png")).toBe(true);
    expect(matchesImageSignature(GIF87, "image/gif")).toBe(true);
    expect(matchesImageSignature(GIF89, "image/gif")).toBe(true);
    expect(matchesImageSignature(WEBP, "image/webp")).toBe(true);
    expect(matchesImageSignature(AVIF, "image/avif")).toBe(true);
    expect(matchesImageSignature(AVIF_SEQUENCE, "image/avif")).toBe(true);
  });

  // The whole point: `File.type` is a guess from the extension and is forgeable,
  // so the bytes have to back the claim up.
  test("rejects content whose bytes contradict the declared type", () => {
    expect(matchesImageSignature(PNG, "image/jpeg")).toBe(false);
    expect(matchesImageSignature(JPEG, "image/png")).toBe(false);
    expect(matchesImageSignature(GIF89, "image/webp")).toBe(false);
  });

  test("rejects an SVG declared as a PNG", () => {
    const svg = ascii(
      '<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>',
    );
    expect(matchesImageSignature(svg, "image/png")).toBe(false);
  });

  test("rejects an HTML document declared as an image", () => {
    const html = ascii("<!doctype html><script>alert(1)</script>");
    expect(matchesImageSignature(html, "image/gif")).toBe(false);
  });

  // A RIFF container that isn't WebP (a .wav, say) shares the first four bytes.
  test("rejects a RIFF container that is not WebP", () => {
    const wav = concat(ascii("RIFF"), bytes(0x20, 0, 0, 0), ascii("WAVEfmt "));
    expect(matchesImageSignature(wav, "image/webp")).toBe(false);
  });

  test("rejects a truncated buffer that only starts like an image", () => {
    expect(matchesImageSignature(bytes(0x89, 0x50), "image/png")).toBe(false);
    expect(matchesImageSignature(new Uint8Array(), "image/png")).toBe(false);
  });

  test("rejects a mime type it has no signature for", () => {
    expect(matchesImageSignature(PNG, "image/svg+xml")).toBe(false);
    expect(matchesImageSignature(PNG, "application/octet-stream")).toBe(false);
  });
});
