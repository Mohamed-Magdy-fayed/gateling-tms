import { TRPCError } from "@trpc/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { CoursesTable, OrganizationsTable } from "@/drizzle/schema";
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
import { PLAN_LIMITS } from "@/features/core/organizations/server";
import {
  findCourseIdsById,
  findCourseIdsByName,
  type Reader,
} from "./import-lookup";
import {
  courseNameKey,
  type ExistingCourses,
  type ImportedCourseRow,
  resolveCourseRows,
} from "./import-resolution";
import { courseImportColumns } from "./import-template";
import {
  type CourseImportCommitInput,
  type CourseImportPreviewInput,
  type CourseImportRow,
  courseImportRowSchema,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

function actorLabel(ctx: OrgTRPCContext): string {
  const session = ctx.session;
  if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });
  return session.user.email ?? session.user.id;
}

function translateLabel(ctx: OrgTRPCContext, key: MessageKey): string {
  return ctx.t(key, {});
}

/**
 * The courses the file refers to that already exist in this organization,
 * looked up the two ways a row can name one: by `id` (what a re-imported
 * export carries) and by name.
 */
async function findExistingCourses(
  reader: Reader,
  organizationId: string,
  rows: ImportedCourseRow[],
): Promise<ExistingCourses> {
  const ids = [...new Set(rows.map((row) => row.parsed.id).filter(Boolean))];
  const nameKeys = [
    ...new Set(
      rows
        .map((row) => courseNameKey(row.parsed.name))
        .filter((name) => name !== ""),
    ),
  ];

  // Sequential rather than Promise.all: inside the commit these run on the
  // transaction's single connection, which can't serve two queries at once.
  const byId = await findCourseIdsById(reader, organizationId, ids);
  const byName = await findCourseIdsByName(reader, organizationId, nameKeys);

  return { byId, byName };
}

function remainingCourseCapacity(organization: {
  plan: keyof typeof PLAN_LIMITS;
  courseCount: number;
}): number | null {
  const limit = PLAN_LIMITS[organization.plan].maxCourses;
  return limit === null ? null : Math.max(0, limit - organization.courseCount);
}

/**
 * Header matching, per-row validation and the within-file duplicate checks.
 * Two identity passes rather than one: a file can repeat the same course by
 * id in one place and by name in another, and each deserves its own message.
 */
function reviewCourseFile(
  ctx: OrgTRPCContext,
  table: WorkbookTable,
): { reviewed: ReviewedRows<CourseImportRow>; unknownHeaders: string[] } {
  const result = reviewImportTable({
    table,
    columns: courseImportColumns,
    validate: zodRowValidator(courseImportRowSchema),
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
    (row) => courseNameKey(row.parsed.name),
    { column: "name", message: "import.validation.duplicateName" },
  );

  return { reviewed, unknownHeaders: result.unknownHeaders };
}

async function loadOrganizationPlan(ctx: OrgTRPCContext) {
  const organization = await ctx.db.query.OrganizationsTable.findFirst({
    where: eq(OrganizationsTable.id, ctx.organizationId),
    columns: { plan: true, courseCount: true },
  });

  if (!organization) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.noActiveOrganization"),
    });
  }

  return organization;
}

export async function previewCourseImport(
  ctx: OrgTRPCContext,
  input: CourseImportPreviewInput,
): Promise<ImportPreviewResult> {
  const parsed = await parseImportFile(input.fileName, input.base64);
  if (!parsed.ok) throw importFileError(ctx, parsed.problem);

  const { reviewed, unknownHeaders } = reviewCourseFile(ctx, parsed.table);
  const existing = await findExistingCourses(
    ctx.db,
    ctx.organizationId,
    reviewed.valid,
  );
  const resolved = resolveCourseRows(reviewed, existing);
  const organization = await loadOrganizationPlan(ctx);

  return {
    columns: courseImportColumns.map((column) => ({
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
    importableCount: capacityCutoff(
      resolved.actions,
      remainingCourseCapacity(organization),
    ),
  };
}

/**
 * Re-validates the rows the client sends back. The preview is stateless, so
 * nothing here is trusted just because an earlier call happened to accept it:
 * the same schema and the same duplicate checks run again.
 */
function validateCommitRows(
  ctx: OrgTRPCContext,
  rows: Record<string, string>[],
): ImportedCourseRow[] {
  const validate = zodRowValidator(courseImportRowSchema);
  const reviewed: ReviewedRows<CourseImportRow> = { valid: [], invalid: [] };

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
    (row) => courseNameKey(row.parsed.name),
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

export async function commitCourseImport(
  ctx: OrgTRPCContext,
  input: CourseImportCommitInput,
): Promise<ImportCommitResult> {
  const rows = validateCommitRows(ctx, input.rows);
  const actor = actorLabel(ctx);

  return ctx.db.transaction(async (trx) => {
    // Same lock as createCourse: two concurrent imports must not both read the
    // same courseCount and both pass the plan check.
    const [organization] = await trx
      .select({
        plan: OrganizationsTable.plan,
        courseCount: OrganizationsTable.courseCount,
      })
      .from(OrganizationsTable)
      .where(eq(OrganizationsTable.id, ctx.organizationId))
      .for("update");

    if (!organization) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.noActiveOrganization"),
      });
    }

    const existing = await findExistingCourses(trx, ctx.organizationId, rows);
    // The same resolution the preview ran, so the commit can't accept a row
    // the review screen rejected — an unknown id, or a second row targeting a
    // course an earlier row already claims.
    const resolved = resolveCourseRows({ valid: rows, invalid: [] }, existing);

    if (resolved.invalid.length > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: ctx.t("import.errors.invalidRows"),
      });
    }

    const createIndexes = resolved.actions
      .map((action, index) => (action === "create" ? index : -1))
      .filter((index) => index !== -1);
    const capacity = remainingCourseCapacity(organization);

    if (capacity !== null && createIndexes.length > capacity) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ctx.t("organizations.limits.courseLimitReached", {
          limit: PLAN_LIMITS[organization.plan].maxCourses ?? 0,
        }),
      });
    }

    let updated = 0;

    for (let index = 0; index < rows.length; index++) {
      const courseId = resolved.targets[index];
      if (courseId === null) continue;

      await trx
        .update(CoursesTable)
        .set({
          name: rows[index].parsed.name,
          description: rows[index].parsed.description || null,
          updatedBy: actor,
        })
        .where(
          and(
            eq(CoursesTable.id, courseId),
            eq(CoursesTable.organizationId, ctx.organizationId),
            isNull(CoursesTable.deletedAt),
          ),
        );

      updated++;
    }

    if (createIndexes.length > 0) {
      await trx.insert(CoursesTable).values(
        createIndexes.map((index) => ({
          organizationId: ctx.organizationId,
          name: rows[index].parsed.name,
          description: rows[index].parsed.description || null,
          createdBy: actor,
        })),
      );

      await trx
        .update(OrganizationsTable)
        .set({
          courseCount: sql`${OrganizationsTable.courseCount} + ${createIndexes.length}`,
        })
        .where(eq(OrganizationsTable.id, ctx.organizationId));
    }

    return { created: createIndexes.length, updated };
  });
}
