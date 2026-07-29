import type { ImportColumn, ImportTemplate } from "@/features/core/import/lib";

/**
 * The levels template (`docs/rebuild/phases/phase-07.md` step 2, STATE.md
 * D117). Levels get their own file rather than riding along as a delimited
 * cell on the courses sheet: the parser reads one sheet with one flat column
 * list, and a separate file lets an academy rename or re-order a single level
 * without rewriting its whole course row.
 *
 * `courseName` names an existing course — a levels file never creates one.
 */
export const levelImportColumns: ImportColumn[] = [
  {
    key: "id",
    labelKey: "import.levels.columns.id",
    required: false,
    example: "",
    hintKey: "import.levels.hints.id",
  },
  {
    key: "courseName",
    labelKey: "import.levels.columns.courseName",
    required: true,
    example: "General English",
    hintKey: "import.levels.hints.courseName",
  },
  {
    key: "name",
    labelKey: "import.levels.columns.name",
    required: true,
    example: "Beginner",
    hintKey: "import.levels.hints.name",
  },
  {
    key: "order",
    labelKey: "import.levels.columns.order",
    required: false,
    example: "1",
    hintKey: "import.levels.hints.order",
  },
];

export const levelImportTemplate: ImportTemplate = {
  entity: "levels",
  titleKey: "import.levels.title",
  columns: levelImportColumns,
};
