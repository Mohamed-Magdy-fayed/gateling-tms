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
