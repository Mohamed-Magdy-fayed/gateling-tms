import { z } from "zod";
import { translationKey } from "@/features/core/i18n/global";
import { SYSTEM_SETTING_CODES } from "../lib/system-settings-registry";

/** Long enough for any key or URL a provider issues; short enough that a pasted document is refused. */
const MAX_SETTING_VALUE_LENGTH = 2000;

export const updateSystemSettingSchema = z.object({
  code: z.enum(SYSTEM_SETTING_CODES as [string, ...string[]]),
  // An empty string clears the value — that is how an admin disconnects an
  // integration without needing a separate "remove" action.
  value: z
    .string()
    .trim()
    .max(MAX_SETTING_VALUE_LENGTH, translationKey("forms.validation.max2000")),
});

export type UpdateSystemSettingInput = z.infer<
  typeof updateSystemSettingSchema
>;

/** Registry codes are zero-padded numbers; anything longer is not one of ours. */
const MAX_ACADEMY_SETTING_CODE_LENGTH = 128;
/** Longer than any enum option a preference will declare. */
const MAX_ACADEMY_SETTING_TEXT_LENGTH = 128;

// The code is checked against the registry in the mutation (an unknown code is
// BAD_REQUEST with a translated message), and the value against the schema
// built from that entry's control — neither is knowable from the input alone.
const academySettingCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_ACADEMY_SETTING_CODE_LENGTH);

export const updateAcademySettingSchema = z.object({
  code: academySettingCodeSchema,
  value: z.union([
    z.boolean(),
    z.number(),
    z.string().max(MAX_ACADEMY_SETTING_TEXT_LENGTH),
  ]),
});

export type UpdateAcademySettingInput = z.infer<
  typeof updateAcademySettingSchema
>;

export const resetAcademySettingSchema = z.object({
  code: academySettingCodeSchema,
});

export type ResetAcademySettingInput = z.infer<
  typeof resetAcademySettingSchema
>;
