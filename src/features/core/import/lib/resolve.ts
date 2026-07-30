import type { ImportRowAction } from "./preview";
import type { ReviewedRows } from "./rows";
import type { ImportRowError, InvalidImportRow, ValidImportRow } from "./types";

/**
 * What committing one row would do, decided against what the organization
 * already holds. `rejected` carries the message the review screen shows — a
 * row naming an id the organization doesn't have, a name that matches nothing,
 * a status change the entity's lifecycle forbids.
 */
export type RowOutcome =
  | { action: "create" }
  | { action: "update"; entityId: string }
  | { rejected: ImportRowError };

export type ResolvedImportRows<TParsed> = {
  valid: ValidImportRow<TParsed>[];
  invalid: InvalidImportRow[];
  /** Aligned with `valid`. */
  actions: ImportRowAction[];
  /** Aligned with `valid`: the record an update targets, `null` for a create. */
  targets: (string | null)[];
};

/**
 * Resolves every reviewed row and moves the ones that can't be committed into
 * `invalid`, keeping the file's row order.
 *
 * On top of whatever `resolveRow` rejects, one rejection belongs here rather
 * than in the earlier per-column duplicate passes: a row targeting a record an
 * *earlier* row already targets. Those passes only compare a column against
 * itself, so a file naming the same record by `id` in one row and by name or
 * email in another slips through — both would UPDATE the same record, the
 * later silently overwriting the earlier, and the reported "updated" count
 * would count one record twice (STATE.md D116).
 *
 * Every entity's preview and commit run through this, so neither can drift
 * into accepting what the other rejects.
 */
export function resolveEntityRows<TParsed>(
  reviewed: ReviewedRows<TParsed>,
  resolveRow: (row: ValidImportRow<TParsed>) => RowOutcome,
  duplicateTargetError: ImportRowError,
): ResolvedImportRows<TParsed> {
  const valid: ValidImportRow<TParsed>[] = [];
  const actions: ImportRowAction[] = [];
  const targets: (string | null)[] = [];
  const invalid = [...reviewed.invalid];
  const claimedEntityIds = new Set<string>();

  for (const row of reviewed.valid) {
    const outcome = resolveRow(row);

    if ("rejected" in outcome) {
      invalid.push({
        rowNumber: row.rowNumber,
        values: row.values,
        errors: [outcome.rejected],
      });
      continue;
    }

    if (outcome.action === "update") {
      if (claimedEntityIds.has(outcome.entityId)) {
        invalid.push({
          rowNumber: row.rowNumber,
          values: row.values,
          errors: [duplicateTargetError],
        });
        continue;
      }
      claimedEntityIds.add(outcome.entityId);
    }

    valid.push(row);
    actions.push(outcome.action);
    targets.push(outcome.action === "update" ? outcome.entityId : null);
  }

  return {
    valid,
    actions,
    targets,
    invalid: invalid.sort((a, b) => a.rowNumber - b.rowNumber),
  };
}
