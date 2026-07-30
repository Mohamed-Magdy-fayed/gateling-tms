import type { ImportColumn, ImportTemplate } from "@/features/core/import/lib";

/**
 * The courses template (`docs/rebuild/phases/phase-07.md` step 2). `id` comes
 * first and is optional, the same round-trip key the trainees template uses:
 * download → edit → upload corrects existing courses instead of duplicating
 * them, and a file typed from scratch simply leaves it out.
 *
 * There is deliberately no thumbnail column (STATE.md D120): `updateCourse`
 * deletes the previous Firebase object and refunds its bytes when the URL
 * changes, and an import that set the column without replicating that refund
 * would leak storage budget the organization can never reclaim. Thumbnails
 * stay a UI concern.
 */
export const courseImportColumns: ImportColumn[] = [
  {
    key: "id",
    labelKey: "import.courses.columns.id",
    required: false,
    example: "",
    hintKey: "import.courses.hints.id",
  },
  {
    key: "name",
    labelKey: "import.courses.columns.name",
    required: true,
    example: "General English",
    hintKey: "import.courses.hints.name",
  },
  {
    key: "description",
    labelKey: "import.courses.columns.description",
    required: false,
    example: "Four levels from beginner to upper intermediate.",
    hintKey: "import.courses.hints.description",
  },
];

export const courseImportTemplate: ImportTemplate = {
  entity: "courses",
  titleKey: "import.courses.title",
  columns: courseImportColumns,
};
