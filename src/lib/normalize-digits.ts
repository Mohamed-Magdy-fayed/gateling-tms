/** Arabic-Indic (U+0660–0669) and extended/Persian (U+06F0–06F9) digit runs. */
const NON_LATIN_DIGIT = /[٠-٩۰-۹]/g;
const ARABIC_DECIMAL_SEPARATOR = /٫/g;

/**
 * Rewrites Arabic-Indic (٠-٩) and Persian (۰-۹) digits — and the Arabic
 * decimal separator (٫) — as their Latin forms, so what an Arabic keyboard
 * types can go through `Number()` and a Zod parse. Everything else is left
 * as-is: this normalises digits, it does not validate the number.
 */
export function normalizeDigits(input: string): string {
  return input
    .replace(NON_LATIN_DIGIT, (digit) => {
      const codePoint = digit.charCodeAt(0);
      const zero = codePoint >= 0x06f0 ? 0x06f0 : 0x0660;
      return String(codePoint - zero);
    })
    .replace(ARABIC_DECIMAL_SEPARATOR, ".");
}
