import {
  type ResolvedImportRows,
  type ReviewedRows,
  type RowOutcome,
  resolveEntityRows,
  type ValidImportRow,
} from "@/features/core/import/lib";
import type { CourseImportRow } from "./schemas";

/**
 * The database-free half of the courses import: given the rows and what the
 * organization already has, decide what each row would do. Kept apart from
 * `import.ts` so it can be unit-tested without a database or an environment.
 */

export type ImportedCourseRow = ValidImportRow<CourseImportRow>;

/** Existing courses the file refers to, indexed the two ways a row names one. */
export type ExistingCourses = {
  byId: Map<string, string>;
  byName: Map<string, string>;
};

/** Case-insensitive, so "General English" and "general english" are one course. */
export function courseNameKey(name: string): string {
  return name.trim().toLowerCase();
}

export function resolveCourseRow(
  row: ImportedCourseRow,
  existing: ExistingCourses,
): RowOutcome {
  if (row.parsed.id !== "") {
    const courseId = existing.byId.get(row.parsed.id);
    return courseId
      ? { action: "update", entityId: courseId }
      : {
          rejected: {
            column: "id",
            message: "import.validation.unknownCourseId",
          },
        };
  }

  const courseId = existing.byName.get(courseNameKey(row.parsed.name));
  return courseId
    ? { action: "update", entityId: courseId }
    : { action: "create" };
}

export type ResolvedCourseRows = ResolvedImportRows<CourseImportRow>;

export function resolveCourseRows(
  reviewed: ReviewedRows<CourseImportRow>,
  existing: ExistingCourses,
): ResolvedCourseRows {
  return resolveEntityRows(reviewed, (row) => resolveCourseRow(row, existing), {
    column: "",
    message: "import.validation.duplicateCourse",
  });
}
