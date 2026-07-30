import type { ImportColumn, ImportTemplate } from "@/features/core/import/lib";

/**
 * The enrollments template (`docs/rebuild/phases/phase-07.md` step 2). An
 * enrollment links a trainee to a course, so both must already exist — a row
 * naming either one that doesn't is reported rather than silently created
 * (STATE.md D119).
 *
 * A trainee can be named by email or by name. Email wins when both are given;
 * a name matching two trainees is refused rather than guessed at.
 */
export const enrollmentImportColumns: ImportColumn[] = [
  {
    key: "id",
    labelKey: "import.enrollments.columns.id",
    required: false,
    example: "",
    hintKey: "import.enrollments.hints.id",
  },
  {
    key: "traineeEmail",
    labelKey: "import.enrollments.columns.traineeEmail",
    required: false,
    example: "sara@example.com",
    hintKey: "import.enrollments.hints.traineeEmail",
  },
  {
    key: "traineeName",
    labelKey: "import.enrollments.columns.traineeName",
    required: false,
    example: "Sara Ahmed",
    hintKey: "import.enrollments.hints.traineeName",
  },
  {
    key: "courseName",
    labelKey: "import.enrollments.columns.courseName",
    required: true,
    example: "General English",
    hintKey: "import.enrollments.hints.courseName",
  },
  {
    key: "status",
    labelKey: "import.enrollments.columns.status",
    required: false,
    example: "waiting",
    hintKey: "import.enrollments.hints.status",
  },
];

export const enrollmentImportTemplate: ImportTemplate = {
  entity: "enrollments",
  titleKey: "import.enrollments.title",
  columns: enrollmentImportColumns,
};
