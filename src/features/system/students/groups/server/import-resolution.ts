import {
  type ResolvedImportRows,
  type ReviewedRows,
  type RowOutcome,
  resolveEntityRows,
  type ValidImportRow,
} from "@/features/core/import/lib";
import {
  lookupTraineeId,
  matchKey,
  type TraineeDirectory,
} from "../../import-reference-keys";
import type { GroupStudentImportRow } from "./schemas";

/**
 * The database-free half of the group-assignments import. Kept apart from
 * `import.ts` so the matching rules can be unit-tested without a database.
 */

export type ImportedGroupStudentRow = ValidImportRow<GroupStudentImportRow>;

export function membershipKey(groupKey: string, traineeId: string): string {
  return `${groupKey}:${traineeId}`;
}

export type GroupStudentReferences = {
  trainees: TraineeDirectory;
  /**
   * Group name key → id for the groups that already exist. A name that isn't
   * here is created at commit time, so its absence is not a rejection.
   */
  groupIdsByName: Map<string, string>;
  /** `membershipKey(groupNameKey, traineeId)` for rosters that already hold this trainee. */
  existingMemberships: Set<string>;
};

/** Where an accepted row points, so the commit doesn't resolve it a second time. */
export type GroupStudentRowTarget = {
  groupNameKey: string;
  groupName: string;
  traineeId: string;
};

function resolveRow(
  row: ImportedGroupStudentRow,
  references: GroupStudentReferences,
  claimedMemberships: Set<string>,
  targets: Map<number, GroupStudentRowTarget>,
): RowOutcome {
  const trainee = lookupTraineeId(
    row.parsed.traineeEmail,
    row.parsed.traineeName,
    references.trainees,
  );
  if ("rejected" in trainee) return trainee;

  const groupNameKey = matchKey(row.parsed.groupName);
  const membership = membershipKey(groupNameKey, trainee.traineeId);

  if (claimedMemberships.has(membership)) {
    return {
      rejected: {
        column: "",
        message: "import.validation.duplicateMembership",
      },
    };
  }
  claimedMemberships.add(membership);
  targets.set(row.rowNumber, {
    groupNameKey,
    groupName: row.parsed.groupName,
    traineeId: trainee.traineeId,
  });

  // "update" here means the trainee is already on this roster, so committing
  // the row changes nothing — the review screen's generic wording is the one
  // place it reads a little loosely, but the count it produces is honest.
  return references.existingMemberships.has(membership)
    ? { action: "update", entityId: membership }
    : { action: "create" };
}

export type ResolvedGroupStudentRows =
  ResolvedImportRows<GroupStudentImportRow> & {
    /** Keyed by row number, for every row in `valid`. */
    rowTargets: Map<number, GroupStudentRowTarget>;
  };

export function resolveGroupStudentRows(
  reviewed: ReviewedRows<GroupStudentImportRow>,
  references: GroupStudentReferences,
): ResolvedGroupStudentRows {
  // Filled as `resolveEntityRows` walks the rows in file order, which is what
  // makes "an earlier row already claims this" answerable at all.
  const claimedMemberships = new Set<string>();
  const rowTargets = new Map<number, GroupStudentRowTarget>();

  const resolved = resolveEntityRows(
    reviewed,
    (row) => resolveRow(row, references, claimedMemberships, rowTargets),
    { column: "", message: "import.validation.duplicateMembership" },
  );

  return { ...resolved, rowTargets };
}
