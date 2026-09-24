import { describe, expect, test } from "vitest";
import { normalizeDigits } from "../src/lib/normalize-digits";

describe("normalizeDigits", () => {
  test("Arabic-Indic digits become Latin", () => {
    expect(normalizeDigits("٣٠")).toBe("30");
    expect(normalizeDigits("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
  });

  test("Persian digits become Latin", () => {
    expect(normalizeDigits("۳۰")).toBe("30");
    expect(normalizeDigits("۰۱۲۳۴۵۶۷۸۹")).toBe("0123456789");
  });

  test("the Arabic decimal separator becomes a dot", () => {
    expect(normalizeDigits("١٫٥")).toBe("1.5");
  });

  test("Latin input and non-digits are left alone", () => {
    expect(normalizeDigits("45")).toBe("45");
    expect(normalizeDigits(" -12 min")).toBe(" -12 min");
    expect(normalizeDigits("")).toBe("");
  });

  test("mixed scripts parse as one number", () => {
    expect(Number(normalizeDigits("1٥۰"))).toBe(150);
  });
});
