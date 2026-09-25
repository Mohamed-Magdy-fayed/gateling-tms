import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { OrganizationSettingsTable } from "@/drizzle/schema";
import { inngest } from "@/integrations/inngest/client";
import {
  academySettingValueSchema,
  findAcademySettingDefinition,
} from "../lib/academy-settings";
import type { AcademySettingDefinition } from "../lib/academy-settings-registry";
import {
  type AcademySettingValue,
  readEffectiveAcademySetting,
} from "./academy-queries";
import type {
  ResetAcademySettingInput,
  UpdateAcademySettingInput,
} from "./schemas";
import type { OrgAdminTRPCContext } from "./types";

type AcademySettingResult = {
  code: string;
  value: AcademySettingValue;
  isCustom: boolean;
};

function requireDefinition(
  ctx: OrgAdminTRPCContext,
  code: string,
): AcademySettingDefinition {
  const definition = findAcademySettingDefinition(code);
  if (!definition) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: ctx.t("settings.errors.unknown"),
    });
  }
  return definition;
}

/**
 * Enqueues a reapply preference's event (R3) from inside the save's
 * transaction (R10). A failed send throws, which rolls the save back: the
 * academy is never left with a new value its existing records were not told
 * about. The payload is ids only — the handler re-reads the current value, so
 * an event whose commit then fails re-applies the old value, a no-op.
 */
async function enqueueReapply(
  ctx: OrgAdminTRPCContext,
  definition: AcademySettingDefinition,
) {
  if (definition.appliesTo === "future") return;

  try {
    await inngest.send({
      name: definition.appliesTo.reapply,
      data: { organizationId: ctx.organizationId, code: definition.code },
    });
  } catch (error) {
    console.error(
      `Failed to enqueue ${definition.appliesTo.reapply} for academy setting ${definition.code}`,
      error,
    );
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: ctx.t("settings.errors.reapplyFailed"),
    });
  }
}

/**
 * Sets one preference for the caller's academy. The value is validated by the
 * schema built from the entry's control and upserted on
 * `(organizationId, code)`, so a double-submitted save leaves one row. A
 * reapply preference enqueues its event only when the effective value really
 * changes.
 */
export async function updateAcademySetting(
  ctx: OrgAdminTRPCContext,
  input: UpdateAcademySettingInput,
): Promise<AcademySettingResult> {
  const definition = requireDefinition(ctx, input.code);
  const parsed = academySettingValueSchema(definition.control).safeParse(
    input.value,
  );
  if (!parsed.success) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: ctx.t("settings.errors.invalidValue"),
    });
  }
  const value = parsed.data;
  const actor = ctx.session.user.email ?? ctx.session.user.id;

  await ctx.db.transaction(async (trx) => {
    const before = await readEffectiveAcademySetting(
      trx,
      ctx.organizationId,
      definition,
    );

    await trx
      .insert(OrganizationSettingsTable)
      .values({
        organizationId: ctx.organizationId,
        code: definition.code,
        value,
        createdBy: actor,
        updatedBy: actor,
      })
      .onConflictDoUpdate({
        target: [
          OrganizationSettingsTable.organizationId,
          OrganizationSettingsTable.code,
        ],
        set: { value, updatedBy: actor, updatedAt: new Date() },
      });

    if (before !== value) await enqueueReapply(ctx, definition);
  });

  return { code: definition.code, value, isCustom: true };
}

/**
 * Returns one preference to the registry default by deleting the academy's
 * row, so the academy follows the default from here on — including any later
 * change to it. Resetting a preference that has no row is a no-op.
 */
export async function resetAcademySetting(
  ctx: OrgAdminTRPCContext,
  input: ResetAcademySettingInput,
): Promise<AcademySettingResult> {
  const definition = requireDefinition(ctx, input.code);

  await ctx.db.transaction(async (trx) => {
    const before = await readEffectiveAcademySetting(
      trx,
      ctx.organizationId,
      definition,
    );

    await trx
      .delete(OrganizationSettingsTable)
      .where(
        and(
          eq(OrganizationSettingsTable.organizationId, ctx.organizationId),
          eq(OrganizationSettingsTable.code, definition.code),
        ),
      );

    if (before !== definition.default) await enqueueReapply(ctx, definition);
  });

  return { code: definition.code, value: definition.default, isCustom: false };
}
