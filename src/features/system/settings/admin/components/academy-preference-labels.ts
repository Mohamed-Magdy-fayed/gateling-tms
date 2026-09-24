import type { useTranslation } from "@/features/core/i18n/client";
import type { mainTranslations } from "@/features/core/i18n/global";
import type { TranslationKey } from "@/features/core/i18n/lib";
import type { AcademySettingControl } from "../../lib/academy-settings-registry";
import type { AcademySettingValue } from "../../server";

type Translate = ReturnType<typeof useTranslation>["t"];

/**
 * A preference's own copy lives at `academySettings.<code>.*` (design 10A).
 * The codes come from the registry at runtime, so the key can't be checked
 * statically here; `tests/i18n-parity.test.ts` holds every registered code to
 * having its label, description, options and unit in both dictionaries.
 */
export function preferenceText(
  t: Translate,
  code: string,
  path: "label" | "description" | "unit" | `options.${string}`,
): string {
  return t(
    `academySettings.${code}.${path}` as TranslationKey<
      typeof mainTranslations
    >,
    {},
  );
}

export function formatPreferenceNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar" : "en").format(value);
}

/** How a value reads in prose — the "Default: …" hint and the confirm dialogs. */
export function formatPreferenceValue(
  t: Translate,
  locale: string,
  code: string,
  control: AcademySettingControl,
  value: AcademySettingValue,
): string {
  switch (control.kind) {
    case "boolean":
      return t(value === true ? "academySettings.on" : "academySettings.off");
    case "enum":
      return preferenceText(t, code, `options.${String(value)}`);
    case "number":
      return t("academySettings.amount", {
        value: formatPreferenceNumber(Number(value), locale),
        unit: preferenceText(t, code, "unit"),
      });
  }
}
