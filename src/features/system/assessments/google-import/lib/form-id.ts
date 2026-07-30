/**
 * Why a caller can't use what they pasted.
 *
 * `responseLink` earns its own case because it is the mistake people actually
 * make: the link Google hands out for *filling in* a form
 * (`/forms/d/e/<id>/viewform`) carries a different id than the API's, so
 * accepting it would produce a confusing 404 from Google instead of an
 * explanation of what to paste.
 */
export type FormIdError = "empty" | "responseLink" | "unrecognized";

export type FormIdResult =
  | { ok: true; formId: string }
  | { ok: false; reason: FormIdError };

// Google's form ids are long opaque tokens; this is the alphabet its URLs use.
const FORM_ID_PATTERN = /^[a-zA-Z0-9_-]{10,}$/;
const EDIT_URL_PATTERN = /\/forms\/d\/([a-zA-Z0-9_-]+)/;
const RESPONSE_URL_PATTERN = /\/forms\/d\/e\/[a-zA-Z0-9_-]+/;

/**
 * Accepts what an admin is likely to have in their clipboard: the editing URL
 * of a Google Form, or the bare id. Pure, so every accepted and rejected shape
 * is unit-testable without a network.
 */
export function extractGoogleFormId(input: string): FormIdResult {
  const value = input.trim();
  if (!value) return { ok: false, reason: "empty" };

  // Checked before the edit pattern, which would otherwise match the literal
  // "e" segment of a response link and hand Google an id it doesn't know.
  if (RESPONSE_URL_PATTERN.test(value)) {
    return { ok: false, reason: "responseLink" };
  }

  const fromUrl = value.match(EDIT_URL_PATTERN)?.[1];
  if (fromUrl) return { ok: true, formId: fromUrl };

  if (FORM_ID_PATTERN.test(value)) return { ok: true, formId: value };

  return { ok: false, reason: "unrecognized" };
}
