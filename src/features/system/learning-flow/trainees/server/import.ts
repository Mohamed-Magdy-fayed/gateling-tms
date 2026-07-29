import { TRPCError } from "@trpc/server";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import type { Transaction } from "@/drizzle";
import {
  GroupStudentsTable,
  GroupsTable,
  OrganizationsTable,
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
import { PLAN_LIMITS } from "@/features/core/organizations/server";
import {
  distinctGroupNames,
  type ExistingTrainees,
  emailKey,
  groupKey,
  type ImportedTraineeRow,
  resolveRows,
} from "./import-resolution";
import { traineeImportColumns } from "./import-template";
import {
  type TraineeImportCommitInput,
  type TraineeImportPreviewInput,
  type TraineeImportRow,
  traineeImportRowSchema,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

type ImportedRow = ImportedTraineeRow;

/** Reads run either on the request connection or inside the commit's own transaction. */
type Reader = OrgTRPCContext["db"] | Transaction;

function actorLabel(ctx: OrgTRPCContext): string {
  const session = ctx.session;
  if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });
  return session.user.email ?? session.user.id;
}

function translateLabel(ctx: OrgTRPCContext, key: MessageKey): string {
  return ctx.t(key, {});
}

/**
 * The trainees the file refers to that already exist in this organization,
 * looked up the two ways a row can name one: by `id` (what a re-imported
 * export carries) and by email.
 */
async function findExistingTrainees(
  reader: Reader,
  organizationId: string,
  rows: ImportedRow[],
): Promise<ExistingTrainees> {
  const ids = [...new Set(rows.map((row) => row.parsed.id).filter(Boolean))];
  const emails = [
    ...new Set(
      rows
        .map((row) => emailKey(row.parsed.email))
        .filter((email): email is string => email !== null),
    ),
  ];

  const byId = new Map<string, string>();
  const byEmail = new Map<string, string>();
  if (ids.length === 0 && emails.length === 0) return { byId, byEmail };

  const identityMatches = [
    ids.length > 0 ? inArray(TraineesTable.id, ids) : undefined,
    emails.length > 0
      ? inArray(sql`lower(${TraineesTable.email})`, emails)
      : undefined,
  ].filter((condition) => condition !== undefined);

  const matches = await reader
    .select({ id: TraineesTable.id, email: TraineesTable.email })
    .from(TraineesTable)
    .where(
      and(
        eq(TraineesTable.organizationId, organizationId),
        isNull(TraineesTable.deletedAt),
        or(...identityMatches),
      ),
    )
    .orderBy(TraineesTable.id);

  for (const match of matches) {
    byId.set(match.id, match.id);
    const key = match.email ? emailKey(match.email) : null;
    // Nothing stops two trainees sharing an email, so pick deterministically
    // (the query is ordered by id) instead of letting row order decide which
    // one a re-import updates.
    if (key !== null && !byEmail.has(key)) byEmail.set(key, match.id);
  }

  return { byId, byEmail };
}

function remainingStudentCapacity(organization: {
  plan: keyof typeof PLAN_LIMITS;
  studentCount: number;
}): number | null {
  const limit = PLAN_LIMITS[organization.plan].maxStudents;
  return limit === null ? null : Math.max(0, limit - organization.studentCount);
}

/**
 * Header matching, per-row validation and the within-file duplicate checks.
 * Two identity passes rather than one: a file can repeat the same person by
 * id in one place and by email in another, and each deserves its own message.
 */
function reviewTraineeFile(
  ctx: OrgTRPCContext,
  table: WorkbookTable,
): { reviewed: ReviewedRows<TraineeImportRow>; unknownHeaders: string[] } {
  const result = reviewImportTable({
    table,
    columns: traineeImportColumns,
    validate: zodRowValidator(traineeImportRowSchema),
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
    (row) => emailKey(row.parsed.email),
    { column: "email", message: "import.validation.duplicateEmail" },
  );

  return { reviewed, unknownHeaders: result.unknownHeaders };
}

async function loadOrganizationPlan(ctx: OrgTRPCContext) {
  const organization = await ctx.db.query.OrganizationsTable.findFirst({
    where: eq(OrganizationsTable.id, ctx.organizationId),
    columns: { plan: true, studentCount: true },
  });

  if (!organization) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.noActiveOrganization"),
    });
  }

  return organization;
}

export async function previewTraineeImport(
  ctx: OrgTRPCContext,
  input: TraineeImportPreviewInput,
): Promise<ImportPreviewResult> {
  const parsed = await parseImportFile(input.fileName, input.base64);
  if (!parsed.ok) throw importFileError(ctx, parsed.problem);

  const { reviewed, unknownHeaders } = reviewTraineeFile(ctx, parsed.table);
  const existing = await findExistingTrainees(
    ctx.db,
    ctx.organizationId,
    reviewed.valid,
  );
  const resolved = resolveRows(reviewed, existing);
  const organization = await loadOrganizationPlan(ctx);

  return {
    columns: traineeImportColumns.map((column) => ({
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
      remainingStudentCapacity(organization),
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
): ImportedRow[] {
  const validate = zodRowValidator(traineeImportRowSchema);
  const reviewed: ReviewedRows<TraineeImportRow> = { valid: [], invalid: [] };

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
    (row) => emailKey(row.parsed.email),
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
 * Resolves each distinct group name in the batch to a group id, creating the
 * ones that don't exist yet. An auto-created group carries no schedule, so it
 * generates no sessions until someone sets one — the roster is the point here,
 * not the calendar.
 */
async function resolveGroupIds(
  trx: Transaction,
  organizationId: string,
  names: string[],
): Promise<Map<string, string>> {
  const idByKey = new Map<string, string>();
  if (names.length === 0) return idByKey;

  const existing = await trx
    .select({ id: GroupsTable.id, name: GroupsTable.name })
    .from(GroupsTable)
    .where(
      and(
        eq(GroupsTable.organizationId, organizationId),
        inArray(
          sql`lower(${GroupsTable.name})`,
          names.map((name) => groupKey(name)),
        ),
      ),
    )
    .orderBy(GroupsTable.id);

  for (const group of existing) {
    const key = groupKey(group.name);
    if (!idByKey.has(key)) idByKey.set(key, group.id);
  }

  const missing = names.filter((name) => !idByKey.has(groupKey(name)));
  if (missing.length === 0) return idByKey;

  const created = await trx
    .insert(GroupsTable)
    .values(missing.map((name) => ({ organizationId, name })))
    .returning({ id: GroupsTable.id, name: GroupsTable.name });

  for (const group of created) idByKey.set(groupKey(group.name), group.id);

  return idByKey;
}

export async function commitTraineeImport(
  ctx: OrgTRPCContext,
  input: TraineeImportCommitInput,
): Promise<ImportCommitResult> {
  const rows = validateCommitRows(ctx, input.rows);
  const actor = actorLabel(ctx);

  return ctx.db.transaction(async (trx) => {
    // Same lock as createTrainee: two concurrent imports must not both read
    // the same studentCount and both pass the plan check.
    const [organization] = await trx
      .select({
        plan: OrganizationsTable.plan,
        studentCount: OrganizationsTable.studentCount,
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

    const existing = await findExistingTrainees(trx, ctx.organizationId, rows);
    // The same resolution the preview ran, so the commit can't accept a row
    // the review screen rejected — an unknown id, or a second row targeting a
    // trainee an earlier row already claims.
    const resolved = resolveRows({ valid: rows, invalid: [] }, existing);

    if (resolved.invalid.length > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: ctx.t("import.errors.invalidRows"),
      });
    }

    const createIndexes = resolved.actions
      .map((action, index) => (action === "create" ? index : -1))
      .filter((index) => index !== -1);
    const capacity = remainingStudentCapacity(organization);

    if (capacity !== null && createIndexes.length > capacity) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ctx.t("organizations.limits.studentLimitReached", {
          limit: PLAN_LIMITS[organization.plan].maxStudents ?? 0,
        }),
      });
    }

    const traineeIdByRow = new Array<string>(rows.length);
    let updated = 0;

    for (let index = 0; index < rows.length; index++) {
      const traineeId = resolved.targets[index];
      if (traineeId === null) continue;
      const { parsed } = rows[index];

      await trx
        .update(TraineesTable)
        .set({
          name: parsed.name,
          phone: parsed.phone || null,
          email: parsed.email || null,
          updatedBy: actor,
        })
        .where(
          and(
            eq(TraineesTable.id, traineeId),
            eq(TraineesTable.organizationId, ctx.organizationId),
            isNull(TraineesTable.deletedAt),
          ),
        );

      traineeIdByRow[index] = traineeId;
      updated++;
    }

    if (createIndexes.length > 0) {
      const inserted = await trx
        .insert(TraineesTable)
        .values(
          createIndexes.map((index) => ({
            organizationId: ctx.organizationId,
            name: rows[index].parsed.name,
            phone: rows[index].parsed.phone || null,
            email: rows[index].parsed.email || null,
            createdBy: actor,
          })),
        )
        .returning({ id: TraineesTable.id });

      // Postgres returns inserted rows in the order they were supplied.
      createIndexes.forEach((rowIndex, position) => {
        traineeIdByRow[rowIndex] = inserted[position].id;
      });

      await trx
        .update(OrganizationsTable)
        .set({
          studentCount: sql`${OrganizationsTable.studentCount} + ${createIndexes.length}`,
        })
        .where(eq(OrganizationsTable.id, ctx.organizationId));
    }

    const groupIdByKey = await resolveGroupIds(
      trx,
      ctx.organizationId,
      distinctGroupNames(rows),
    );

    const rosterRows = rows
      .map((row, index) => {
        const groupId = groupIdByKey.get(groupKey(row.parsed.groupName));
        if (!groupId) return null;
        return {
          organizationId: ctx.organizationId,
          groupId,
          traineeId: traineeIdByRow[index],
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    if (rosterRows.length > 0) {
      await trx
        .insert(GroupStudentsTable)
        .values(rosterRows)
        .onConflictDoNothing({
          target: [GroupStudentsTable.groupId, GroupStudentsTable.traineeId],
        });
    }

    return { created: createIndexes.length, updated };
  });
}
