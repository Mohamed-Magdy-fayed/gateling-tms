import { TRPCError } from "@trpc/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { GroupStudentsTable, GroupsTable } from "@/drizzle/schema";
import {
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
  distinctNames,
  matchKey,
  optionalMatchKey,
} from "../../import-reference-keys";
import {
  findTraineeDirectory,
  type Reader,
  resolveGroupIds,
} from "../../import-references";
import {
  type GroupStudentReferences,
  type ImportedGroupStudentRow,
  membershipKey,
  resolveGroupStudentRows,
} from "./import-resolution";
import { groupStudentImportColumns } from "./import-template";
import {
  type GroupStudentImportCommitInput,
  type GroupStudentImportPreviewInput,
  type GroupStudentImportRow,
  groupStudentImportRowSchema,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

function translateLabel(ctx: OrgTRPCContext, key: MessageKey): string {
  return ctx.t(key, {});
}

/**
 * Everything the file names that already exists: the trainees it points at,
 * the groups whose names it uses, and the roster entries those two already
 * share. Groups it doesn't find are created at commit time, so a missing one
 * is not an error here.
 */
async function loadReferences(
  reader: Reader,
  organizationId: string,
  rows: ImportedGroupStudentRow[],
): Promise<GroupStudentReferences> {
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
  const groupNameKeys = distinctNames(
    rows.map((row) => row.parsed.groupName),
  ).map((name) => matchKey(name));

  const trainees = await findTraineeDirectory(
    reader,
    organizationId,
    emailKeys,
    nameKeys,
  );

  const groupIdsByName = new Map<string, string>();
  const existingMemberships = new Set<string>();
  if (groupNameKeys.length === 0) {
    return { trainees, groupIdsByName, existingMemberships };
  }

  const groups = await reader
    .select({ id: GroupsTable.id, name: GroupsTable.name })
    .from(GroupsTable)
    .where(
      and(
        eq(GroupsTable.organizationId, organizationId),
        inArray(sql`lower(${GroupsTable.name})`, groupNameKeys),
      ),
    )
    .orderBy(GroupsTable.id);

  const groupNameById = new Map<string, string>();
  for (const group of groups) {
    const key = matchKey(group.name);
    // Nothing stops two groups sharing a name; the lowest id wins, the same
    // choice `resolveGroupIds` makes, so preview and commit agree.
    if (!groupIdsByName.has(key)) {
      groupIdsByName.set(key, group.id);
      groupNameById.set(group.id, key);
    }
  }

  const groupIds = [...groupIdsByName.values()];
  if (groupIds.length > 0) {
    const memberships = await reader
      .select({
        groupId: GroupStudentsTable.groupId,
        traineeId: GroupStudentsTable.traineeId,
      })
      .from(GroupStudentsTable)
      .where(
        and(
          eq(GroupStudentsTable.organizationId, organizationId),
          inArray(GroupStudentsTable.groupId, groupIds),
        ),
      );

    for (const membership of memberships) {
      const groupNameKey = groupNameById.get(membership.groupId);
      if (groupNameKey === undefined) continue;
      existingMemberships.add(
        membershipKey(groupNameKey, membership.traineeId),
      );
    }
  }

  return { trainees, groupIdsByName, existingMemberships };
}

function reviewGroupStudentFile(
  ctx: OrgTRPCContext,
  table: WorkbookTable,
): { reviewed: ReviewedRows<GroupStudentImportRow>; unknownHeaders: string[] } {
  const result = reviewImportTable({
    table,
    columns: groupStudentImportColumns,
    validate: zodRowValidator(groupStudentImportRowSchema),
    translateLabel: (key) => translateLabel(ctx, key),
  });

  if (!result.ok) throw missingColumnsError(ctx, result.missingColumnLabels);

  // Repeated group/trainee pairs are caught during resolution rather than
  // here: it takes a resolved trainee id to be right, since one row may name a
  // trainee by email and another the same trainee by name.
  return { reviewed: result.reviewed, unknownHeaders: result.unknownHeaders };
}

export async function previewGroupStudentImport(
  ctx: OrgTRPCContext,
  input: GroupStudentImportPreviewInput,
): Promise<ImportPreviewResult> {
  const parsed = await parseImportFile(input.fileName, input.base64);
  if (!parsed.ok) throw importFileError(ctx, parsed.problem);

  const { reviewed, unknownHeaders } = reviewGroupStudentFile(
    ctx,
    parsed.table,
  );
  const references = await loadReferences(
    ctx.db,
    ctx.organizationId,
    reviewed.valid,
  );
  const resolved = resolveGroupStudentRows(reviewed, references);

  return {
    columns: groupStudentImportColumns.map((column) => ({
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
    // Placing an existing trainee in a class costs no plan capacity — the
    // student cap was spent when the trainee was created.
    importableCount: capacityCutoff(resolved.actions, null),
  };
}

function validateCommitRows(
  ctx: OrgTRPCContext,
  rows: Record<string, string>[],
): ImportedGroupStudentRow[] {
  const validate = zodRowValidator(groupStudentImportRowSchema);
  const valid: ImportedGroupStudentRow[] = [];

  rows.forEach((values, index) => {
    const result = validate(values);
    if (!result.ok) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: ctx.t("import.errors.invalidRows"),
      });
    }
    valid.push({ rowNumber: index + 1, values, parsed: result.parsed });
  });

  return valid;
}

export async function commitGroupStudentImport(
  ctx: OrgTRPCContext,
  input: GroupStudentImportCommitInput,
): Promise<ImportCommitResult> {
  const rows = validateCommitRows(ctx, input.rows);

  return ctx.db.transaction(async (trx) => {
    const references = await loadReferences(trx, ctx.organizationId, rows);
    const resolved = resolveGroupStudentRows(
      { valid: rows, invalid: [] },
      references,
    );

    if (resolved.invalid.length > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: ctx.t("import.errors.invalidRows"),
      });
    }

    const groupIdByKey = await resolveGroupIds(
      trx,
      ctx.organizationId,
      distinctNames(rows.map((row) => row.parsed.groupName)),
    );

    const rosterRows: {
      organizationId: string;
      groupId: string;
      traineeId: string;
    }[] = [];
    let created = 0;
    let updated = 0;

    for (let index = 0; index < resolved.valid.length; index++) {
      const row = resolved.valid[index];
      // Both lookups are invariants, not user-facing conditions: resolution
      // records a target for every valid row, and resolveGroupIds resolves
      // every distinct group name the batch carries (creating the missing
      // ones). A miss means the two normalized the same name differently — a
      // regression to surface, not a row to silently drop and miscount.
      const target = resolved.rowTargets.get(row.rowNumber);
      if (!target) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: ctx.t("errors.generic"),
        });
      }
      const groupId = groupIdByKey.get(target.groupNameKey);
      if (!groupId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: ctx.t("errors.generic"),
        });
      }

      rosterRows.push({
        organizationId: ctx.organizationId,
        groupId,
        traineeId: target.traineeId,
      });

      if (resolved.actions[index] === "create") created++;
      else updated++;
    }

    if (rosterRows.length > 0) {
      await trx
        .insert(GroupStudentsTable)
        .values(rosterRows)
        // The same conflict target addGroupStudents uses, so re-importing a
        // roster is a no-op rather than an error.
        .onConflictDoNothing({
          target: [GroupStudentsTable.groupId, GroupStudentsTable.traineeId],
        });
    }

    return { created, updated };
  });
}
