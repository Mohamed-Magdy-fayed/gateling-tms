import type {
  ImportRowAction,
  InvalidImportRow,
  ReviewedRows,
  ValidImportRow,
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
 * What committing one row would do. `null` means the row names an `id` this
 * organization doesn't have — rejected rather than created, since silently
 * inserting a new trainee under a different id would look like the edit
 * worked while leaving the original untouched.
 */
export type RowResolution =
  | { action: "create" }
  | { action: "update"; traineeId: string }
  | null;

export function resolveRow(
  row: ImportedTraineeRow,
  existing: ExistingTrainees,
): RowResolution {
  if (row.parsed.id !== "") {
    const traineeId = existing.byId.get(row.parsed.id);
    return traineeId ? { action: "update", traineeId } : null;
  }

  const key = emailKey(row.parsed.email);
  const traineeId = key === null ? undefined : existing.byEmail.get(key);
  return traineeId ? { action: "update", traineeId } : { action: "create" };
}

export type ResolvedRows = {
  valid: ImportedTraineeRow[];
  invalid: InvalidImportRow[];
  actions: ImportRowAction[];
  /** Aligned with `valid`: the trainee an "update" row targets. */
  resolutions: Exclude<RowResolution, null>[];
};

/**
 * Resolves every row and rejects the ones that can't be committed. Two
 * rejections happen here rather than in the earlier per-column duplicate
 * passes, because both need to know what the database holds:
 *
 * - an `id` this organization doesn't have;
 * - a row targeting a trainee an *earlier* row already targets. The column
 *   duplicate checks only compare a column against itself, so a file where
 *   row 2 names a trainee by `id` and row 5 names the same trainee by `email`
 *   slipped through — both would have run an UPDATE against the same record,
 *   the later silently overwriting the earlier, and the reported "updated"
 *   count would have counted one trainee twice.
 *
 * Both the preview and the commit go through this, so neither can drift into
 * accepting what the other rejects.
 */
export function resolveRows(
  reviewed: ReviewedRows<TraineeImportRow>,
  existing: ExistingTrainees,
): ResolvedRows {
  const valid: ImportedTraineeRow[] = [];
  const actions: ImportRowAction[] = [];
  const resolutions: Exclude<RowResolution, null>[] = [];
  const invalid = [...reviewed.invalid];
  const claimedTraineeIds = new Set<string>();

  for (const row of reviewed.valid) {
    const resolution = resolveRow(row, existing);
    if (resolution === null) {
      invalid.push({
        rowNumber: row.rowNumber,
        values: row.values,
        errors: [{ column: "id", message: "import.validation.unknownId" }],
      });
      continue;
    }

    if (
      resolution.action === "update" &&
      claimedTraineeIds.has(resolution.traineeId)
    ) {
      invalid.push({
        rowNumber: row.rowNumber,
        values: row.values,
        errors: [{ column: "", message: "import.validation.duplicateTrainee" }],
      });
      continue;
    }
    if (resolution.action === "update") {
      claimedTraineeIds.add(resolution.traineeId);
    }

    valid.push(row);
    actions.push(resolution.action);
    resolutions.push(resolution);
  }

  return {
    valid,
    actions,
    resolutions,
    invalid: invalid.sort((a, b) => a.rowNumber - b.rowNumber),
  };
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
