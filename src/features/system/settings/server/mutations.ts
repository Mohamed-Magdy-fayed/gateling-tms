import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { SettingsTable } from "@/drizzle/schema";
import {
  getSystemSettingDefinition,
  isSystemSettingCode,
} from "../lib/system-settings-registry";
import { ensureSystemSettingRows } from "./queries";
import type { UpdateSystemSettingInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

/**
 * Sets one deployment-wide value. Admin-only by the router; the registry
 * decides whether the value is acceptable. An empty value clears the setting
 * — that is how an integration is disconnected — so "clear" and "set" are one
 * action with one audit trail (`updatedBy`).
 */
export async function updateSystemSetting(
  ctx: OrgTRPCContext,
  input: UpdateSystemSettingInput,
): Promise<{ code: string; hasValue: boolean }> {
  if (!isSystemSettingCode(input.code)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: ctx.t("settings.errors.unknown"),
    });
  }
  const definition = getSystemSettingDefinition(input.code);
  const value = input.value.trim() || null;

  if (value && definition.validateValue && !definition.validateValue(value)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: ctx.t("settings.errors.invalidValue"),
    });
  }

  await ensureSystemSettingRows(ctx.db);

  await ctx.db
    .update(SettingsTable)
    .set({
      value,
      updatedBy: ctx.session.user.email ?? ctx.session.user.id,
      updatedAt: new Date(),
    })
    .where(eq(SettingsTable.code, input.code));

  return { code: input.code, hasValue: value !== null };
}
