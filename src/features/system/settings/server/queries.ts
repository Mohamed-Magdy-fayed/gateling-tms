import { inArray } from "drizzle-orm";
import type { Database } from "@/drizzle";
import { SettingsTable } from "@/drizzle/schema";
import {
  getSystemSettingDefinition,
  isSystemSettingCode,
  SYSTEM_SETTING_CODES,
  SYSTEM_SETTINGS,
  type SystemSettingCode,
} from "../lib/system-settings-registry";
import type { OrgTRPCContext } from "./types";

export type SystemSettingRow = {
  code: SystemSettingCode;
  group: "meetings";
  isSecret: boolean;
  /** Null for a secret that is set — the list never echoes a credential. */
  value: string | null;
  hasValue: boolean;
  updatedAt: Date | null;
};

/**
 * Whoever wrote a row that no human did. Rows are created lazily the first
 * time they are needed (below), so a deployment that was never seeded still
 * has something for an admin to edit.
 */
const SYSTEM_ACTOR = "system";

/**
 * Guarantees one row per registry code. Insert-or-ignore on the unique
 * `code`, so it is safe from a request path, a seed, and two of either at
 * once — the registry is the source of which rows should exist, the table
 * only the source of their values.
 */
export async function ensureSystemSettingRows(db: Database): Promise<void> {
  await db
    .insert(SettingsTable)
    .values(
      SYSTEM_SETTINGS.map((definition) => ({
        code: definition.code,
        label: definition.label,
        value: definition.seedValue,
        isActive: true,
        createdBy: SYSTEM_ACTOR,
      })),
    )
    .onConflictDoNothing({ target: SettingsTable.code });
}

/**
 * Raw values by code, for the server code that *uses* a setting (the
 * Meetings client, the webhook receiver). Never reaches a tRPC response —
 * that is what `listSystemSettings` is for, and it masks.
 */
export async function readSystemSettingValues(
  db: Database,
  codes: readonly SystemSettingCode[],
): Promise<Map<SystemSettingCode, string | null>> {
  const rows = await db
    .select({ code: SettingsTable.code, value: SettingsTable.value })
    .from(SettingsTable)
    .where(inArray(SettingsTable.code, [...codes]));

  const values = new Map<SystemSettingCode, string | null>();
  for (const code of codes) values.set(code, null);
  for (const row of rows) {
    if (isSystemSettingCode(row.code)) {
      values.set(row.code, row.value?.trim() || null);
    }
  }
  return values;
}

/** The admin's view: every registered setting, secrets reported but not shown. */
export async function listSystemSettings(
  ctx: OrgTRPCContext,
): Promise<SystemSettingRow[]> {
  await ensureSystemSettingRows(ctx.db);

  const rows = await ctx.db
    .select({
      code: SettingsTable.code,
      value: SettingsTable.value,
      updatedAt: SettingsTable.updatedAt,
    })
    .from(SettingsTable)
    .where(inArray(SettingsTable.code, [...SYSTEM_SETTING_CODES]));

  const byCode = new Map(rows.map((row) => [row.code, row]));

  // Registry order, not table order: the page reads top to bottom as a setup
  // guide, and that order belongs to the code, not to insertion time.
  return SYSTEM_SETTINGS.map((definition) => {
    const row = byCode.get(definition.code);
    const value = row?.value?.trim() || null;
    return {
      code: definition.code,
      group: definition.group,
      isSecret: definition.isSecret,
      value: definition.isSecret ? null : value,
      hasValue: value !== null,
      updatedAt: row?.updatedAt ?? null,
    };
  });
}

export { getSystemSettingDefinition };
