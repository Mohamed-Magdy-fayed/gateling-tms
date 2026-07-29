import { mainTranslations } from "@/features/core/i18n/global";
import { createI18n } from "@/features/core/i18n/lib";
import type { ImportColumn } from "./types";

const SUPPORTED_LOCALES = Object.keys(mainTranslations);

/**
 * Lowercased, whitespace-collapsed, punctuation-free form of a header cell.
 * Spreadsheet round-trips add non-breaking spaces, trailing colons and case
 * changes that would otherwise turn a perfectly good file into "unknown
 * column". JavaScript's `\s` covers the non-breaking space too, so collapsing
 * runs of it is enough — no separate NBSP pass needed.
 */
export function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[:*()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Every spelling of a column we accept as its header: the canonical key plus
 * its label in each supported locale, so a file downloaded as an Arabic
 * template re-imports unchanged, and so does one whose headers were typed by
 * hand in English.
 */
export function headerAliases(column: ImportColumn): string[] {
  const labels = SUPPORTED_LOCALES.map((locale) =>
    // `{}` for the arguments a parameterized key would take — a column label
    // never has any, the same call shape `FormBase` uses for error keys.
    createI18n(mainTranslations, locale, "en").t(column.labelKey, {}),
  );
  return [column.key, ...labels].map(normalizeHeader);
}

export type HeaderMapping = {
  /** Canonical column key → its index in the file's header row. */
  columnIndexByKey: Record<string, number>;
  /** Required columns the file has no header for — a hard stop. */
  missingRequiredKeys: string[];
  /** Headers we couldn't place; reported so the user can spot a typo. */
  unknownHeaders: string[];
};

export function mapHeaders(
  fileHeaders: string[],
  columns: ImportColumn[],
): HeaderMapping {
  const keyByAlias = new Map<string, string>();
  for (const column of columns) {
    for (const alias of headerAliases(column)) {
      if (alias) keyByAlias.set(alias, column.key);
    }
  }

  const columnIndexByKey: Record<string, number> = {};
  const unknownHeaders: string[] = [];

  fileHeaders.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    if (!normalized) return;
    const key = keyByAlias.get(normalized);
    if (key === undefined) {
      unknownHeaders.push(header.trim());
      return;
    }
    // First occurrence wins, so a duplicated header doesn't shift the mapping
    // onto a trailing empty copy of the same column.
    if (columnIndexByKey[key] === undefined) columnIndexByKey[key] = index;
  });

  const missingRequiredKeys = columns
    .filter(
      (column) => column.required && columnIndexByKey[column.key] === undefined,
    )
    .map((column) => column.key);

  return { columnIndexByKey, missingRequiredKeys, unknownHeaders };
}
