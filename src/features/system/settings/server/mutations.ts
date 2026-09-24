import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { SettingsTable } from "@/drizzle/schema";
import {
  getSystemSettingDefinition,
  isSystemSettingCode,
} from "../lib/system-settings-registry";
import type { UpdateSystemSettingInput } from "./schemas";
import type { PlatformOwnerTRPCContext } from "./types";

/**
 * Sets one deployment-wide value. Platform-owner-only by the router; the registry
 * decides whether the value is acceptable. An empty value clears the setting
 * — that is how an integration is disconnected — so "clear" and "set" are one
 * action with one audit trail (`updatedBy`).
 */
export async function updateSystemSetting(
  ctx: PlatformOwnerTRPCContext,
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

  const [updated] = await ctx.db
    .update(SettingsTable)
    .set({
      value,
      updatedBy: ctx.session.user.email ?? ctx.session.user.id,
      updatedAt: new Date(),
    })
    .where(eq(SettingsTable.code, input.code))
    .returning({ code: SettingsTable.code });

  // A registered code with no row means its data migration hasn't landed —
  // an operator problem to surface, not one to paper over from a request.
  if (!updated) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("settings.errors.unknown"),
    });
  }

  return { code: input.code, hasValue: value !== null };
}
