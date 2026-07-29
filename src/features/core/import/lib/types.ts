import type { mainTranslations } from "@/features/core/i18n/global";
import type { TranslationKey } from "@/features/core/i18n/lib";

export type MessageKey = TranslationKey<typeof mainTranslations>;

/** One column of an import template. */
export type ImportColumn = {
  /** Canonical field name — the key every parsed row is keyed by. */
  key: string;
  /** Localized header written into the template and shown on the review screen. */
  labelKey: MessageKey;
  required: boolean;
  /** Value written into the template's example row. */
  example: string;
  /** Format or valid-values note for the template's reference sheet. */
  hintKey?: MessageKey;
};

/**
 * The shape of one importable entity's file. Deliberately data-only: the
 * matching write path lives with the entity, so a template can be rendered
 * (template route, review screen) without pulling in any database code.
 */
export type ImportTemplate = {
  /** Slug used in `/api/import/templates/<entity>`. */
  entity: string;
  titleKey: MessageKey;
  columns: ImportColumn[];
};

/** One data row of an uploaded file, keyed by canonical column key. */
export type ImportRecord = {
  /** 1-based row number as the user sees it in their spreadsheet. */
  rowNumber: number;
  values: Record<string, string>;
};

export type ImportRowError = {
  /** Canonical column key, or `""` when the error is about the whole row. */
  column: string;
  /** A translation key when the validator supplied one, else literal text. */
  message: string;
};

export type ValidImportRow<TParsed> = ImportRecord & { parsed: TParsed };

export type InvalidImportRow = ImportRecord & { errors: ImportRowError[] };
