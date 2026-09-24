import { and, eq } from "drizzle-orm";
import type { DatabaseOrTransaction } from "@/drizzle";
import { OrganizationSettingsTable } from "@/drizzle/schema";
import {
  academySettingValueSchema,
  findAcademySettingDefinition,
  listAcademySettingDefinitions,
} from "../lib/academy-settings";
import type {
  AcademySettingControl,
  AcademySettingDefinition,
  AcademySettingGroup,
  AcademySettings,
} from "../lib/academy-settings-registry";
import type { OrgAdminTRPCContext } from "./types";

export type AcademySettingValue = boolean | string | number;

type Override = { value: AcademySettingValue; updatedAt: Date | null };

/**
 * A stored value run back through its entry's control. A value that no longer
 * parses — the control was narrowed after it was saved — falls back to the
 * default rather than throwing into whatever flow is reading it, and is logged
 * so the drift is found rather than silently absorbed.
 */
export function parseStoredAcademySetting(
  definition: AcademySettingDefinition,
  raw: unknown,
  organizationId: string,
): AcademySettingValue | undefined {
  const parsed = academySettingValueSchema(definition.control).safeParse(raw);
  if (parsed.success) return parsed.data;

  console.error(
    `Invalid stored academy setting; using the default (organizationId=${organizationId}, code=${definition.code})`,
    parsed.error.issues,
  );
  return undefined;
}

/**
 * One academy's valid overrides by code — one query on the
 * `(organizationId, code)` index. Rows for unknown or retired codes are
 * ignored, and invalid values are dropped (and logged), so every value in
 * the map is safe to use as-is.
 */
async function readAcademySettingOverrides(
  db: DatabaseOrTransaction,
  organizationId: string,
): Promise<Map<string, Override>> {
  const rows = await db
    .select({
      code: OrganizationSettingsTable.code,
      value: OrganizationSettingsTable.value,
      updatedAt: OrganizationSettingsTable.updatedAt,
    })
    .from(OrganizationSettingsTable)
    .where(eq(OrganizationSettingsTable.organizationId, organizationId));

  const overrides = new Map<string, Override>();
  for (const row of rows) {
    const definition = findAcademySettingDefinition(row.code);
    if (!definition) continue;
    const value = parseStoredAcademySetting(
      definition,
      row.value,
      organizationId,
    );
    if (value !== undefined) {
      overrides.set(row.code, { value, updatedAt: row.updatedAt });
    }
  }
  return overrides;
}

/**
 * What one preference currently resolves to for an academy — its override, or
 * the default. The mutations compare this before and after a change to decide
 * whether a reapply event is owed.
 */
export async function readEffectiveAcademySetting(
  db: DatabaseOrTransaction,
  organizationId: string,
  definition: AcademySettingDefinition,
): Promise<AcademySettingValue> {
  const [row] = await db
    .select({ value: OrganizationSettingsTable.value })
    .from(OrganizationSettingsTable)
    .where(
      and(
        eq(OrganizationSettingsTable.organizationId, organizationId),
        eq(OrganizationSettingsTable.code, definition.code),
      ),
    );
  if (!row) return definition.default;

  return (
    parseStoredAcademySetting(definition, row.value, organizationId) ??
    definition.default
  );
}

/**
 * Every registered preference's effective value for one academy (R2). Takes
 * the database explicitly so tRPC handlers, Inngest jobs and Server Components
 * all read the same way — jobs read once per run and pass the values down.
 * Server Components use the `cache()`d `getAcademySettings` instead.
 */
export async function readAcademySettings(
  db: DatabaseOrTransaction,
  organizationId: string,
): Promise<AcademySettings> {
  const overrides = await readAcademySettingOverrides(db, organizationId);
  const settings: Record<string, AcademySettingValue> = {};
  for (const definition of listAcademySettingDefinitions()) {
    settings[definition.code] =
      overrides.get(definition.code)?.value ?? definition.default;
  }
  return settings as AcademySettings;
}

export type AcademySettingRow = {
  code: string;
  group: AcademySettingGroup;
  control: AcademySettingControl;
  /** Whether saving touches existing records (R3); the event name stays server-side. */
  appliesTo: "future" | "reapply";
  value: AcademySettingValue;
  defaultValue: AcademySettingValue;
  /** The academy chose this value; `false` means it is following the default. */
  isCustom: boolean;
  updatedAt: Date | null;
};

/** The academy admin's view: every registered preference, in registry order. */
export async function listAcademySettings(
  ctx: OrgAdminTRPCContext,
): Promise<AcademySettingRow[]> {
  const overrides = await readAcademySettingOverrides(
    ctx.db,
    ctx.organizationId,
  );

  return listAcademySettingDefinitions().map((definition) => {
    const override = overrides.get(definition.code);
    return {
      code: definition.code,
      group: definition.group,
      control: definition.control,
      appliesTo: definition.appliesTo === "future" ? "future" : "reapply",
      value: override?.value ?? definition.default,
      defaultValue: definition.default,
      isCustom: override !== undefined,
      updatedAt: override?.updatedAt ?? null,
    };
  });
}
