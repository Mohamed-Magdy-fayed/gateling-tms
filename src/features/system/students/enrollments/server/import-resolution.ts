import type { EnrollmentStatus } from "@/drizzle/schema";
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
import {
  ENROLLMENT_TRANSITIONS,
  isValidTransition,
} from "../../status-transitions";
import type { EnrollmentImportRow } from "./schemas";

/**
 * The database-free half of the enrollments import. Kept apart from
 * `import.ts` so the lifecycle and duplicate rules can be unit-tested without a
 * database or an environment.
 */

export type ImportedEnrollmentRow = ValidImportRow<EnrollmentImportRow>;

/** The status a new enrollment gets when the file leaves the column blank. */
export const DEFAULT_IMPORT_ENROLLMENT_STATUS: EnrollmentStatus = "waiting";

export type ExistingEnrollment = {
  id: string;
  traineeId: string;
  courseId: string;
  status: EnrollmentStatus;
};

export type ExistingEnrollments = {
  byId: Map<string, ExistingEnrollment>;
  /**
   * Keyed by `enrollmentPairKey` and holding only enrollments in a status that
   * still counts as live — the same rule `createEnrollment` enforces. A
   * finished or cancelled enrollment doesn't block a repeat one.
   */
  activeByPair: Map<string, ExistingEnrollment>;
};

export type ImportReferences = {
  trainees: TraineeDirectory;
  coursesByName: Map<string, string>;
};

export function enrollmentPairKey(traineeId: string, courseId: string): string {
  return `${traineeId}:${courseId}`;
}

/** Where an accepted row points, so the commit doesn't resolve it a second time. */
export type EnrollmentRowTarget = {
  traineeId: string;
  courseId: string;
  status: EnrollmentStatus | null;
};

function resolveRow(
  row: ImportedEnrollmentRow,
  references: ImportReferences,
  existing: ExistingEnrollments,
  claimedPairs: Set<string>,
  targets: Map<number, EnrollmentRowTarget>,
): RowOutcome {
  const trainee = lookupTraineeId(
    row.parsed.traineeEmail,
    row.parsed.traineeName,
    references.trainees,
  );
  if ("rejected" in trainee) return trainee;

  const courseId = references.coursesByName.get(
    matchKey(row.parsed.courseName),
  );
  if (courseId === undefined) {
    return {
      rejected: {
        column: "courseName",
        message: "import.validation.unknownCourse",
      },
    };
  }

  const requestedStatus =
    row.parsed.status === "" ? null : (row.parsed.status as EnrollmentStatus);
  const pair = enrollmentPairKey(trainee.traineeId, courseId);
  const target: EnrollmentRowTarget = {
    traineeId: trainee.traineeId,
    courseId,
    status: requestedStatus,
  };

  const current =
    row.parsed.id === ""
      ? existing.activeByPair.get(pair)
      : existing.byId.get(row.parsed.id);

  if (row.parsed.id !== "" && !current) {
    return {
      rejected: {
        column: "id",
        message: "import.validation.unknownEnrollmentId",
      },
    };
  }

  // An enrollment's trainee and course are its identity — pointing an id at a
  // different pair would rewrite history rather than edit it, the same reason
  // `enrollmentStatusSchema` only carries a status.
  if (
    current &&
    (current.traineeId !== trainee.traineeId || current.courseId !== courseId)
  ) {
    return {
      rejected: {
        column: "id",
        message: "import.validation.enrollmentMismatch",
      },
    };
  }

  // Two rows can't both act on the same trainee/course pair: a second create
  // would produce the double active enrollment `createEnrollment` refuses, and
  // a second update would silently overwrite the first.
  if (claimedPairs.has(pair)) {
    return {
      rejected: {
        column: "",
        message: "import.validation.duplicateEnrollment",
      },
    };
  }

  if (
    current &&
    requestedStatus !== null &&
    !isValidTransition(ENROLLMENT_TRANSITIONS, current.status, requestedStatus)
  ) {
    return {
      rejected: {
        column: "status",
        message: "import.validation.invalidTransition",
      },
    };
  }

  claimedPairs.add(pair);
  targets.set(row.rowNumber, target);

  return current
    ? { action: "update", entityId: current.id }
    : { action: "create" };
}

export type ResolvedEnrollmentRows = ResolvedImportRows<EnrollmentImportRow> & {
  /** Keyed by row number, for every row in `valid`. */
  rowTargets: Map<number, EnrollmentRowTarget>;
};

export function resolveEnrollmentRows(
  reviewed: ReviewedRows<EnrollmentImportRow>,
  references: ImportReferences,
  existing: ExistingEnrollments,
): ResolvedEnrollmentRows {
  // Both are filled as `resolveEntityRows` walks the rows in file order, which
  // is what makes "an earlier row already claims this" answerable at all.
  const claimedPairs = new Set<string>();
  const rowTargets = new Map<number, EnrollmentRowTarget>();

  const resolved = resolveEntityRows(
    reviewed,
    (row) => resolveRow(row, references, existing, claimedPairs, rowTargets),
    { column: "", message: "import.validation.duplicateEnrollment" },
  );

  return { ...resolved, rowTargets };
}
