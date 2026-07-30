import {
  type ResolvedImportRows,
  type ReviewedRows,
  type RowOutcome,
  resolveEntityRows,
  type ValidImportRow,
} from "@/features/core/import/lib";
import type { LevelImportRow } from "./schemas";

/**
 * The database-free half of the levels import: given the rows, the courses the
 * organization has and the levels already under them, decide what each row
 * would do. Kept apart from `import.ts` so it can be unit-tested without a
 * database or an environment.
 */

export type ImportedLevelRow = ValidImportRow<LevelImportRow>;

export type ExistingLevel = { id: string; courseId: string };

export type ExistingLevels = {
  byId: Map<string, ExistingLevel>;
  /** Keyed by `levelKey(courseId, name)` — level names are unique per course, not per org. */
  byCourseAndName: Map<string, string>;
};

/** Case-insensitive, matching how courses and groups are matched elsewhere. */
export function levelNameKey(name: string): string {
  return name.trim().toLowerCase();
}

export function levelKey(courseId: string, name: string): string {
  return `${courseId}:${levelNameKey(name)}`;
}

/**
 * The course a row attaches to, or `undefined` when the organization has no
 * course by that name. Shared by the resolution and the commit so both agree
 * on which course a row belongs to.
 */
export function resolveRowCourseId(
  row: ImportedLevelRow,
  coursesByName: Map<string, string>,
): string | undefined {
  return coursesByName.get(levelNameKey(row.parsed.courseName));
}

export function resolveLevelRow(
  row: ImportedLevelRow,
  coursesByName: Map<string, string>,
  existing: ExistingLevels,
): RowOutcome {
  const courseId = resolveRowCourseId(row, coursesByName);
  if (courseId === undefined) {
    return {
      rejected: {
        column: "courseName",
        message: "import.validation.unknownCourse",
      },
    };
  }

  if (row.parsed.id !== "") {
    const level = existing.byId.get(row.parsed.id);
    if (!level) {
      return {
        rejected: { column: "id", message: "import.validation.unknownLevelId" },
      };
    }
    // A level can't be moved between courses (levelUpdateSchema doesn't allow
    // it either), so a row naming one course and an id from another is a
    // mistake worth reporting rather than half-applying.
    if (level.courseId !== courseId) {
      return {
        rejected: {
          column: "courseName",
          message: "import.validation.levelCourseMismatch",
        },
      };
    }
    return { action: "update", entityId: level.id };
  }

  const levelId = existing.byCourseAndName.get(
    levelKey(courseId, row.parsed.name),
  );
  return levelId
    ? { action: "update", entityId: levelId }
    : { action: "create" };
}

export type ResolvedLevelRows = ResolvedImportRows<LevelImportRow>;

export function resolveLevelRows(
  reviewed: ReviewedRows<LevelImportRow>,
  coursesByName: Map<string, string>,
  existing: ExistingLevels,
): ResolvedLevelRows {
  return resolveEntityRows(
    reviewed,
    (row) => resolveLevelRow(row, coursesByName, existing),
    { column: "", message: "import.validation.duplicateLevel" },
  );
}
