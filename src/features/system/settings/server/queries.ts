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

/**
 * The admin's view: every registered setting, secrets reported but not shown.
 *
 * The rows themselves are created by a data migration
 * (`migrations/0024_seed_system_settings.sql`), which is how deployment data
 * reaches every environment — never lazily from a request. A registry code
 * with no row (a migration not yet written for it) still lists, as unset.
 */
export async function listSystemSettings(
  ctx: OrgTRPCContext,
): Promise<SystemSettingRow[]> {
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
