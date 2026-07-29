import { TRPCError } from "@trpc/server";
import { and, eq, inArray, isNull, max } from "drizzle-orm";
import type { Transaction } from "@/drizzle";
import { CoursesTable, LevelsTable } from "@/drizzle/schema";
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
import {
  findCourseIdsByName,
  type Reader,
} from "@/features/system/content-library/courses/server/import-lookup";
import {
  type ExistingLevels,
  type ImportedLevelRow,
  levelKey,
  levelNameKey,
  resolveLevelRows,
  resolveRowCourseId,
} from "./import-resolution";
import { levelImportColumns } from "./import-template";
import {
  type LevelImportCommitInput,
  type LevelImportPreviewInput,
  type LevelImportRow,
  levelImportRowSchema,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

function translateLabel(ctx: OrgTRPCContext, key: MessageKey): string {
  return ctx.t(key, {});
}

function distinctCourseNameKeys(rows: ImportedLevelRow[]): string[] {
  return [
    ...new Set(
      rows
        .map((row) => levelNameKey(row.parsed.courseName))
        .filter((key) => key !== ""),
    ),
  ];
}

/**
 * Every level under the courses the file touches, plus any level named by `id`
 * whose course the file doesn't otherwise mention — the second lookup is what
 * lets a row naming the wrong course report that mismatch instead of a
 * misleading "no level has this id".
 */
async function findExistingLevels(
  reader: Reader,
  organizationId: string,
  rows: ImportedLevelRow[],
  courseIds: string[],
): Promise<ExistingLevels> {
  const byId = new Map<string, { id: string; courseId: string }>();
  const byCourseAndName = new Map<string, string>();

  if (courseIds.length > 0) {
    const levels = await reader
      .select({
        id: LevelsTable.id,
        courseId: LevelsTable.courseId,
        name: LevelsTable.name,
      })
      .from(LevelsTable)
      .where(
        and(
          eq(LevelsTable.organizationId, organizationId),
          inArray(LevelsTable.courseId, courseIds),
        ),
      )
      .orderBy(LevelsTable.id);

    for (const level of levels) {
      byId.set(level.id, { id: level.id, courseId: level.courseId });
      const key = levelKey(level.courseId, level.name);
      // Nothing stops two levels in a course sharing a name; lowest id wins so
      // a re-import is deterministic.
      if (!byCourseAndName.has(key)) byCourseAndName.set(key, level.id);
    }
  }

  const unseenIds = [
    ...new Set(
      rows
        .map((row) => row.parsed.id)
        .filter((id) => id !== "" && !byId.has(id)),
    ),
  ];

  if (unseenIds.length > 0) {
    const levels = await reader
      .select({ id: LevelsTable.id, courseId: LevelsTable.courseId })
      .from(LevelsTable)
      .where(
        and(
          eq(LevelsTable.organizationId, organizationId),
          inArray(LevelsTable.id, unseenIds),
        ),
      );

    for (const level of levels) byId.set(level.id, level);
  }

  return { byId, byCourseAndName };
}

/**
 * Header matching, per-row validation and the within-file duplicate checks.
 * The name check is scoped to the course named in the same row, because two
 * courses may legitimately both have a "Beginner" level.
 */
function reviewLevelFile(
  ctx: OrgTRPCContext,
  table: WorkbookTable,
): { reviewed: ReviewedRows<LevelImportRow>; unknownHeaders: string[] } {
  const result = reviewImportTable({
    table,
    columns: levelImportColumns,
    validate: zodRowValidator(levelImportRowSchema),
    translateLabel: (key) => translateLabel(ctx, key),
  });

  if (!result.ok) throw missingColumnsError(ctx, result.missingColumnLabels);

  const deduplicatedById = flagDuplicateRows(
    result.reviewed,
    (row) => row.parsed.id || null,
    { column: "id", message: "import.validation.duplicateId" },
  );
  const reviewed = flagDuplicateRows(
    deduplicatedById,
    (row) =>
      `${levelNameKey(row.parsed.courseName)}:${levelNameKey(row.parsed.name)}`,
    { column: "name", message: "import.validation.duplicateLevelName" },
  );

  return { reviewed, unknownHeaders: result.unknownHeaders };
}

export async function previewLevelImport(
  ctx: OrgTRPCContext,
  input: LevelImportPreviewInput,
): Promise<ImportPreviewResult> {
  const parsed = await parseImportFile(input.fileName, input.base64);
  if (!parsed.ok) throw importFileError(ctx, parsed.problem);

  const { reviewed, unknownHeaders } = reviewLevelFile(ctx, parsed.table);
  const coursesByName = await findCourseIdsByName(
    ctx.db,
    ctx.organizationId,
    distinctCourseNameKeys(reviewed.valid),
  );
  const existing = await findExistingLevels(
    ctx.db,
    ctx.organizationId,
    reviewed.valid,
    [...new Set(coursesByName.values())],
  );
  const resolved = resolveLevelRows(reviewed, coursesByName, existing);

  return {
    columns: levelImportColumns.map((column) => ({
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
    // Levels carry no plan limit — every valid row is importable.
    importableCount: capacityCutoff(resolved.actions, null),
  };
}

/**
 * Re-validates the rows the client sends back. The preview is stateless, so
 * nothing here is trusted just because an earlier call happened to accept it.
 */
function validateCommitRows(
  ctx: OrgTRPCContext,
  rows: Record<string, string>[],
): ImportedLevelRow[] {
  const validate = zodRowValidator(levelImportRowSchema);
  const reviewed: ReviewedRows<LevelImportRow> = { valid: [], invalid: [] };

  rows.forEach((values, index) => {
    const result = validate(values);
    if (!result.ok) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: ctx.t("import.errors.invalidRows"),
      });
    }
    reviewed.valid.push({
      rowNumber: index + 1,
      values,
      parsed: result.parsed,
    });
  });

  const duplicateError = { column: "", message: "import.errors.invalidRows" };
  const deduplicated = flagDuplicateRows(
    flagDuplicateRows(reviewed, (row) => row.parsed.id || null, duplicateError),
    (row) =>
      `${levelNameKey(row.parsed.courseName)}:${levelNameKey(row.parsed.name)}`,
    duplicateError,
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
 * Locks every course the batch touches, lowest id first so two concurrent
 * imports can't deadlock on each other. The lock is what makes the `order`
 * allocation below safe against `createLevel` running at the same time — it
 * derives the next position from a count under the same lock.
 */
async function lockCourses(
  ctx: OrgTRPCContext,
  trx: Transaction,
  courseIds: string[],
): Promise<void> {
  for (const courseId of [...courseIds].sort()) {
    const [course] = await trx
      .select({ id: CoursesTable.id })
      .from(CoursesTable)
      .where(
        and(
          eq(CoursesTable.id, courseId),
          eq(CoursesTable.organizationId, ctx.organizationId),
          isNull(CoursesTable.deletedAt),
        ),
      )
      .for("update");

    if (!course) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }
  }
}

/**
 * The next free position per course, so a batch of appends lands in file order
 * after whatever the course already has. Matches `createLevel`, which derives
 * the position from the current level count.
 */
async function loadNextOrderByCourse(
  ctx: OrgTRPCContext,
  trx: Transaction,
  courseIds: string[],
): Promise<Map<string, number>> {
  const next = new Map<string, number>();
  if (courseIds.length === 0) return next;

  const maxima = await trx
    .select({
      courseId: LevelsTable.courseId,
      highestOrder: max(LevelsTable.order),
    })
    .from(LevelsTable)
    .where(
      and(
        eq(LevelsTable.organizationId, ctx.organizationId),
        inArray(LevelsTable.courseId, courseIds),
      ),
    )
    .groupBy(LevelsTable.courseId);

  for (const row of maxima) {
    next.set(
      row.courseId,
      row.highestOrder === null ? 0 : row.highestOrder + 1,
    );
  }

  return next;
}

export async function commitLevelImport(
  ctx: OrgTRPCContext,
  input: LevelImportCommitInput,
): Promise<ImportCommitResult> {
  const rows = validateCommitRows(ctx, input.rows);

  return ctx.db.transaction(async (trx) => {
    const coursesByName = await findCourseIdsByName(
      trx,
      ctx.organizationId,
      distinctCourseNameKeys(rows),
    );
    const courseIds = [...new Set(coursesByName.values())];
    await lockCourses(ctx, trx, courseIds);

    // Read the levels *after* locking, so the positions this batch appends to
    // can't shift underneath it.
    const existing = await findExistingLevels(
      trx,
      ctx.organizationId,
      rows,
      courseIds,
    );
    const resolved = resolveLevelRows(
      { valid: rows, invalid: [] },
      coursesByName,
      existing,
    );

    if (resolved.invalid.length > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: ctx.t("import.errors.invalidRows"),
      });
    }

    const nextOrder = await loadNextOrderByCourse(ctx, trx, courseIds);
    const inserts: {
      organizationId: string;
      courseId: string;
      name: string;
      order: number;
    }[] = [];
    let updated = 0;

    for (let index = 0; index < resolved.valid.length; index++) {
      const row = resolved.valid[index];
      const courseId = resolveRowCourseId(row, coursesByName);
      if (courseId === undefined) continue;
      const explicitOrder =
        row.parsed.order === "" ? null : Number(row.parsed.order);
      const levelId = resolved.targets[index];

      if (levelId !== null) {
        await trx
          .update(LevelsTable)
          .set({
            name: row.parsed.name,
            // A blank position means "leave it where it is" rather than
            // "move it to the top".
            ...(explicitOrder === null ? {} : { order: explicitOrder }),
          })
          .where(
            and(
              eq(LevelsTable.id, levelId),
              eq(LevelsTable.organizationId, ctx.organizationId),
            ),
          );
        updated++;
        continue;
      }

      const appended = nextOrder.get(courseId) ?? 0;
      inserts.push({
        organizationId: ctx.organizationId,
        courseId,
        name: row.parsed.name,
        order: explicitOrder ?? appended,
      });
      if (explicitOrder === null) nextOrder.set(courseId, appended + 1);
    }

    if (inserts.length > 0) await trx.insert(LevelsTable).values(inserts);

    return { created: inserts.length, updated };
  });
}
