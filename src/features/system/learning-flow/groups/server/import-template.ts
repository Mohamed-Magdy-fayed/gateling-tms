import type { ImportColumn, ImportTemplate } from "@/features/core/import/lib";

/**
 * The group-assignments template (`docs/rebuild/phases/phase-07.md` step 2) —
 * who sits in which class, for an academy whose rosters live in a spreadsheet.
 *
 * There is no `id` column: a roster entry has no identity a human would keep
 * track of. Re-importing the same file is still safe, because the insert
 * ignores a membership that already exists.
 *
 * A missing group is created (with no schedule, so no sessions are generated),
 * matching what the trainees import already does with its group column. A
 * missing trainee is not: an assignment sheet is about placing people who
 * already exist (STATE.md D119).
 */
export const groupStudentImportColumns: ImportColumn[] = [
  {
    key: "groupName",
    labelKey: "import.groupStudents.columns.groupName",
    required: true,
    example: "Beginners A",
    hintKey: "import.groupStudents.hints.groupName",
  },
  {
    key: "traineeEmail",
    labelKey: "import.groupStudents.columns.traineeEmail",
    required: false,
    example: "sara@example.com",
    hintKey: "import.groupStudents.hints.traineeEmail",
  },
  {
    key: "traineeName",
    labelKey: "import.groupStudents.columns.traineeName",
    required: false,
    example: "Sara Ahmed",
    hintKey: "import.groupStudents.hints.traineeName",
  },
];

export const groupStudentImportTemplate: ImportTemplate = {
  entity: "group-students",
  titleKey: "import.groupStudents.title",
  columns: groupStudentImportColumns,
};
