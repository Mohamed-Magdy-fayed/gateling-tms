import {
  type ResolvedImportRows,
  type ReviewedRows,
  type RowOutcome,
  resolveEntityRows,
  type ValidImportRow,
} from "@/features/core/import/lib";
import type { TraineeImportRow } from "./schemas";

/**
 * The database-free half of the trainees import: given the rows and what the
 * organization already has, decide what each row would do. Kept apart from
 * `import.ts` so it can be unit-tested without a database or an environment.
 */

export type ImportedTraineeRow = ValidImportRow<TraineeImportRow>;

/** Existing trainees the file refers to, indexed the two ways a row names one. */
export type ExistingTrainees = {
  byId: Map<string, string>;
  byEmail: Map<string, string>;
};

/** Case-insensitive, so "Sara@X.com" and "sara@x.com" are the same person. */
export function emailKey(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  return trimmed === "" ? null : trimmed;
}

export function groupKey(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * What committing one row would do. A row naming an `id` this organization
 * doesn't have is rejected rather than created: silently inserting a new
 * trainee under a different id would look like the edit worked while leaving
 * the original untouched.
 */
export function resolveRow(
  row: ImportedTraineeRow,
  existing: ExistingTrainees,
): RowOutcome {
  if (row.parsed.id !== "") {
    const traineeId = existing.byId.get(row.parsed.id);
    return traineeId
      ? { action: "update", entityId: traineeId }
      : { rejected: { column: "id", message: "import.validation.unknownId" } };
  }

  const key = emailKey(row.parsed.email);
  const traineeId = key === null ? undefined : existing.byEmail.get(key);
  return traineeId
    ? { action: "update", entityId: traineeId }
    : { action: "create" };
}

export type ResolvedTraineeRows = ResolvedImportRows<TraineeImportRow>;

export function resolveRows(
  reviewed: ReviewedRows<TraineeImportRow>,
  existing: ExistingTrainees,
): ResolvedTraineeRows {
  return resolveEntityRows(reviewed, (row) => resolveRow(row, existing), {
    column: "",
    message: "import.validation.duplicateTrainee",
  });
}

/** The distinct group names in the batch, keeping each one's first spelling. */
export function distinctGroupNames(rows: ImportedTraineeRow[]): string[] {
  return [
    ...new Map(
      rows
        .map((row) => row.parsed.groupName.trim())
        .filter((name) => name !== "")
        .map((name) => [groupKey(name), name] as const),
    ).values(),
  ];
}
