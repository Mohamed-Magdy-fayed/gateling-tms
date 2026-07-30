import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import type { Transaction } from "@/drizzle";
import {
  type EnrollmentStatus,
  EnrollmentsTable,
  TraineesTable,
} from "@/drizzle/schema";
import {
  flagDuplicateRows,
  type ImportCommitResult,
  type ImportPreviewResult,
  type MessageKey,
  type ReviewedRows,
  zodRowValidator,
} from "@/features/core/import/lib";
import {
  capacityCutoff,
  importFileError,
  missingColumnsError,
  parseImportFile,
  reviewImportTable,
  type WorkbookTable,
} from "@/features/core/import/server";
import { findCourseIdsByName } from "@/features/system/content-library/courses/server/import-lookup";
import {
  distinctNames,
  matchKey,
  optionalMatchKey,
} from "../../import-reference-keys";
import { findTraineeDirectory, type Reader } from "../../import-references";
import {
  DEFAULT_IMPORT_ENROLLMENT_STATUS,
  type ExistingEnrollment,
  type ExistingEnrollments,
  enrollmentPairKey,
  type ImportedEnrollmentRow,
  type ImportReferences,
  resolveEnrollmentRows,
} from "./import-resolution";
import { enrollmentImportColumns } from "./import-template";
import {
  type EnrollmentImportCommitInput,
  type EnrollmentImportPreviewInput,
  type EnrollmentImportRow,
  enrollmentImportRowSchema,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

// The same rule createEnrollment applies: a trainee may repeat a course after
// finishing or cancelling, but may not be enrolled in it twice at once.
const ACTIVE_ENROLLMENT_STATUSES: ReadonlySet<EnrollmentStatus> = new Set([
  "placementTest",
  "waiting",
  "ongoing",
  "postponed",
]);

function translateLabel(ctx: OrgTRPCContext, key: MessageKey): string {
  return ctx.t(key, {});
}

async function loadReferences(
  reader: Reader,
  organizationId: string,
  rows: ImportedEnrollmentRow[],
): Promise<ImportReferences> {
  const emailKeys = [
    ...new Set(
      rows
        .map((row) => optionalMatchKey(row.parsed.traineeEmail))
        .filter((key): key is string => key !== null),
    ),
  ];
  const nameKeys = [
    ...new Set(
      rows
        .map((row) => optionalMatchKey(row.parsed.traineeName))
        .filter((key): key is string => key !== null),
    ),
  ];

  const trainees = await findTraineeDirectory(
    reader,
    organizationId,
    emailKeys,
    nameKeys,
  );
  const coursesByName = await findCourseIdsByName(
    reader,
    organizationId,
    distinctNames(rows.map((row) => row.parsed.courseName)).map((name) =>
      matchKey(name),
    ),
  );

  return { trainees, coursesByName };
}

/**
 * The enrollments the file could be talking about: the ones it names by id,
 * and every enrollment belonging to a trainee it mentions — the second set is
 * what lets a row with no id update the trainee's live enrollment instead of
 * creating a duplicate one.
 */
async function findExistingEnrollments(
  reader: Reader,
  organizationId: string,
  rows: ImportedEnrollmentRow[],
  references: ImportReferences,
): Promise<ExistingEnrollments> {
  const byId = new Map<string, ExistingEnrollment>();
  const activeByPair = new Map<string, ExistingEnrollment>();

  const traineeIds = [
    ...new Set([
      ...references.trainees.byEmail.values(),
      ...[...references.trainees.idsByName.values()].flat(),
    ]),
  ];

  if (traineeIds.length > 0) {
    const enrollments = await reader
      .select({
        id: EnrollmentsTable.id,
        traineeId: EnrollmentsTable.traineeId,
        courseId: EnrollmentsTable.courseId,
        status: EnrollmentsTable.status,
      })
      .from(EnrollmentsTable)
      .where(
        and(
          eq(EnrollmentsTable.organizationId, organizationId),
          inArray(EnrollmentsTable.traineeId, traineeIds),
        ),
      )
      .orderBy(EnrollmentsTable.id);

    for (const enrollment of enrollments) {
      byId.set(enrollment.id, enrollment);
      if (!ACTIVE_ENROLLMENT_STATUSES.has(enrollment.status)) continue;
      const pair = enrollmentPairKey(enrollment.traineeId, enrollment.courseId);
      // Two live enrollments for one pair shouldn't exist; if they somehow do,
      // the lowest id wins so a re-import stays deterministic.
      if (!activeByPair.has(pair)) activeByPair.set(pair, enrollment);
    }
  }

  const unseenIds = [
    ...new Set(
      rows.map((row) => row.parsed.id).filter((id) => id !== "" && !byId.has(id)),
    ),
  ];

  if (unseenIds.length > 0) {
    const enrollments = await reader
      .select({
        id: EnrollmentsTable.id,
        traineeId: EnrollmentsTable.traineeId,
        courseId: EnrollmentsTable.courseId,
        status: EnrollmentsTable.status,
      })
      .from(EnrollmentsTable)
      .where(
        and(
          eq(EnrollmentsTable.organizationId, organizationId),
          inArray(EnrollmentsTable.id, unseenIds),
        ),
      );

    for (const enrollment of enrollments) byId.set(enrollment.id, enrollment);
  }

  return { byId, activeByPair };
}

function reviewEnrollmentFile(
  ctx: OrgTRPCContext,
  table: WorkbookTable,
): { reviewed: ReviewedRows<EnrollmentImportRow>; unknownHeaders: string[] } {
  const result = reviewImportTable({
    table,
    columns: enrollmentImportColumns,
    validate: zodRowValidator(enrollmentImportRowSchema),
    translateLabel: (key) => translateLabel(ctx, key),
  });

  if (!result.ok) throw missingColumnsError(ctx, result.missingColumnLabels);

  const reviewed = flagDuplicateRows(
    result.reviewed,
    (row) => row.parsed.id || null,
    { column: "id", message: "import.validation.duplicateId" },
  );

  // The trainee/course pair is checked during resolution instead of here: it
  // takes resolved ids to be right, since one row may name a trainee by email
  // and another the same trainee by name.
  return { reviewed, unknownHeaders: result.unknownHeaders };
}

export async function previewEnrollmentImport(
  ctx: OrgTRPCContext,
  input: EnrollmentImportPreviewInput,
): Promise<ImportPreviewResult> {
  const parsed = await parseImportFile(input.fileName, input.base64);
  if (!parsed.ok) throw importFileError(ctx, parsed.problem);

  const { reviewed, unknownHeaders } = reviewEnrollmentFile(ctx, parsed.table);
  const references = await loadReferences(
    ctx.db,
    ctx.organizationId,
    reviewed.valid,
  );
  const existing = await findExistingEnrollments(
    ctx.db,
    ctx.organizationId,
    reviewed.valid,
    references,
  );
  const resolved = resolveEnrollmentRows(reviewed, references, existing);

  return {
    columns: enrollmentImportColumns.map((column) => ({
      key: column.key,
      label: translateLabel(ctx, column.labelKey),
      required: column.required,
    })),
    totalRows: resolved.valid.length + resolved.invalid.length,
    validRows: resolved.valid.map((row, index) => ({
      rowNumber: row.rowNumber,
      values: row.values,
      action: resolved.actions[index],
    })),
    invalidRows: resolved.invalid,
    unknownHeaders,
    // Enrollments carry no plan limit of their own — the student cap is spent
    // when the trainee is created, not when they enrol.
    importableCount: capacityCutoff(resolved.actions, null),
  };
}

function validateCommitRows(
  ctx: OrgTRPCContext,
  rows: Record<string, string>[],
): ImportedEnrollmentRow[] {
  const validate = zodRowValidator(enrollmentImportRowSchema);
  const reviewed: ReviewedRows<EnrollmentImportRow> = { valid: [], invalid: [] };

  rows.forEach((values, index) => {
    const result = validate(values);
    if (!result.ok) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: ctx.t("import.errors.invalidRows"),
      });
    }
    reviewed.valid.push({ rowNumber: index + 1, values, parsed: result.parsed });
  });

  const deduplicated = flagDuplicateRows(
    reviewed,
    (row) => row.parsed.id || null,
    { column: "", message: "import.errors.invalidRows" },
  );

  if (deduplicated.invalid.length > 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: ctx.t("import.errors.invalidRows"),
    });
  }

  return deduplicated.valid;
}

/**
 * Locks the trainee rows the batch touches, lowest id first so two concurrent
 * imports can't deadlock. This is the same lock `createEnrollment` takes, and
 * the only thing standing between two requests and a double active enrollment
 * — there is no unique constraint behind that rule.
 */
async function lockTrainees(
  trx: Transaction,
  organizationId: string,
  traineeIds: string[],
): Promise<void> {
  if (traineeIds.length === 0) return;

  await trx
    .select({ id: TraineesTable.id })
    .from(TraineesTable)
    .where(
      and(
        eq(TraineesTable.organizationId, organizationId),
        inArray(TraineesTable.id, [...traineeIds].sort()),
      ),
    )
    .orderBy(TraineesTable.id)
    .for("update");
}

export async function commitEnrollmentImport(
  ctx: OrgTRPCContext,
  input: EnrollmentImportCommitInput,
): Promise<ImportCommitResult> {
  const rows = validateCommitRows(ctx, input.rows);

  return ctx.db.transaction(async (trx) => {
    const references = await loadReferences(trx, ctx.organizationId, rows);
    const traineeIds = [
      ...new Set([
        ...references.trainees.byEmail.values(),
        ...[...references.trainees.idsByName.values()].flat(),
      ]),
    ];
    await lockTrainees(trx, ctx.organizationId, traineeIds);

    // Read after locking, so a concurrent enrollment can't appear between the
    // check and the insert.
    const existing = await findExistingEnrollments(
      trx,
      ctx.organizationId,
      rows,
      references,
    );
    const resolved = resolveEnrollmentRows(
      { valid: rows, invalid: [] },
      references,
      existing,
    );

    if (resolved.invalid.length > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: ctx.t("import.errors.invalidRows"),
      });
    }

    const inserts: {
      organizationId: string;
      traineeId: string;
      courseId: string;
      status: EnrollmentStatus;
    }[] = [];
    let updated = 0;

    for (let index = 0; index < resolved.valid.length; index++) {
      const row = resolved.valid[index];
      const target = resolved.rowTargets.get(row.rowNumber);
      if (!target) continue;
      const enrollmentId = resolved.targets[index];

      if (enrollmentId !== null) {
        // A blank status means "this row just identifies the enrollment", so
        // there is nothing to write — it still counts as matched.
        if (target.status !== null) {
          await trx
            .update(EnrollmentsTable)
            .set({ status: target.status })
            .where(
              and(
                eq(EnrollmentsTable.id, enrollmentId),
                eq(EnrollmentsTable.organizationId, ctx.organizationId),
              ),
            );
        }
        updated++;
        continue;
      }

      inserts.push({
        organizationId: ctx.organizationId,
        traineeId: target.traineeId,
        courseId: target.courseId,
        status: target.status ?? DEFAULT_IMPORT_ENROLLMENT_STATUS,
      });
    }

    if (inserts.length > 0) await trx.insert(EnrollmentsTable).values(inserts);

    return { created: inserts.length, updated };
  });
}
