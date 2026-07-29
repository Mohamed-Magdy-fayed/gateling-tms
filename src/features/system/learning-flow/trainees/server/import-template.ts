import type { ImportColumn, ImportTemplate } from "@/features/core/import/lib";

/**
 * The students template — the migration path for an academy whose roster
 * lives in a spreadsheet (`docs/rebuild/phases/phase-07.md` step 2).
 *
 * `id` comes first and is optional: it is what a re-imported export updates
 * by, so download → edit → upload corrects existing trainees instead of
 * duplicating them. A file typed from scratch simply leaves it out.
 */
export const traineeImportColumns: ImportColumn[] = [
  {
    key: "id",
    labelKey: "import.trainees.columns.id",
    required: false,
    example: "",
    hintKey: "import.trainees.hints.id",
  },
  {
    key: "name",
    labelKey: "import.trainees.columns.name",
    required: true,
    example: "Sara Ahmed",
    hintKey: "import.trainees.hints.name",
  },
  {
    key: "phone",
    labelKey: "import.trainees.columns.phone",
    required: false,
    example: "+20 100 000 0000",
    hintKey: "import.trainees.hints.phone",
  },
  {
    key: "email",
    labelKey: "import.trainees.columns.email",
    required: false,
    example: "sara@example.com",
    hintKey: "import.trainees.hints.email",
  },
  {
    key: "groupName",
    labelKey: "import.trainees.columns.groupName",
    required: false,
    example: "Beginners A",
    hintKey: "import.trainees.hints.groupName",
  },
];

export const traineeImportTemplate: ImportTemplate = {
  entity: "trainees",
  titleKey: "import.trainees.title",
  columns: traineeImportColumns,
};
