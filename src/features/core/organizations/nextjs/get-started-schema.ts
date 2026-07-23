import { z } from "zod";
import { passwordSchema } from "@/features/core/auth/schemas";
import { translationKey } from "@/features/core/i18n/global";

/**
 * SOURCE's get-started/schema.ts (contactName, businessName, email, phone)
 * was a lead-capture form only — the old app onboarded accounts manually
 * behind the scenes. TARGET's get-started actually creates the sign-in
 * account, so it needs a password too (docs/rebuild/STATE.md D51).
 */
export const getStartedSchema = z.object({
  contactName: z
    .string()
    .trim()
    .min(1, translationKey("auth.validation.required")),
  businessName: z
    .string()
    .trim()
    .min(1, translationKey("getStarted.validation.businessNameRequired")),
  email: z.email(translationKey("auth.validation.invalidEmail")),
  phone: z
    .string()
    .trim()
    .min(8, translationKey("auth.validation.invalidPhone")),
  password: passwordSchema,
});

export type GetStartedInput = z.infer<typeof getStartedSchema>;

/** The org-only step for a user who already has an account (OAuth-first
 * entry, or a returning user who signed up but never finished onboarding). */
export const organizationOnlySchema = getStartedSchema.pick({
  businessName: true,
});

export type OrganizationOnlyInput = z.infer<typeof organizationOnlySchema>;
