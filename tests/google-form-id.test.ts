import { describe, expect, test } from "vitest";
import { extractGoogleFormId } from "../src/features/system/assessments/google-import/lib/form-id";

const FORM_ID = "1FAIpQLSdC_x9-abcDEF123456789";

describe("extractGoogleFormId", () => {
  test("takes the id out of an editing URL", () => {
    const result = extractGoogleFormId(
      `https://docs.google.com/forms/d/${FORM_ID}/edit`,
    );

    expect(result).toEqual({ ok: true, formId: FORM_ID });
  });

  test("accepts an editing URL with query parameters", () => {
    const result = extractGoogleFormId(
      `https://docs.google.com/forms/d/${FORM_ID}/edit?usp=sharing#responses`,
    );

    expect(result).toEqual({ ok: true, formId: FORM_ID });
  });

  test("accepts a bare form id", () => {
    expect(extractGoogleFormId(FORM_ID)).toEqual({ ok: true, formId: FORM_ID });
  });

  test("trims surrounding whitespace from a pasted value", () => {
    expect(extractGoogleFormId(`  ${FORM_ID}\n`)).toEqual({
      ok: true,
      formId: FORM_ID,
    });
  });

  test("rejects the response link, whose id is not the API's", () => {
    // /forms/d/e/<id>/viewform is the link Google gives out for filling the
    // form in — accepting it would produce an unexplained 404 from Google.
    const result = extractGoogleFormId(
      "https://docs.google.com/forms/d/e/1FAIpQLSf_responseIdHere/viewform",
    );

    expect(result).toEqual({ ok: false, reason: "responseLink" });
  });

  test("rejects an empty value", () => {
    expect(extractGoogleFormId("   ")).toEqual({ ok: false, reason: "empty" });
  });

  test("rejects a link to something that isn't a form", () => {
    expect(
      extractGoogleFormId("https://docs.google.com/spreadsheets/d/abc123/edit"),
    ).toEqual({ ok: false, reason: "unrecognized" });
  });

  test("rejects a value too short to be a form id", () => {
    expect(extractGoogleFormId("abc123")).toEqual({
      ok: false,
      reason: "unrecognized",
    });
  });
});
