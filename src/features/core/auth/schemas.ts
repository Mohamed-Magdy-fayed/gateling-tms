import { z } from "zod";

import { translationKey } from "@/features/core/i18n/global";

export const passwordSchema = z
  .string()
  .min(8, translationKey("auth.validation.passwordMinLength"))
  .superRefine((value, ctx) => {
    if (!/[a-z]/.test(value)) {
      ctx.addIssue({
        code: "custom",
        message: translationKey("auth.validation.passwordLowercase"),
      });
    }
    if (!/[A-Z]/.test(value)) {
      ctx.addIssue({
        code: "custom",
        message: translationKey("auth.validation.passwordUppercase"),
      });
    }
    if (!/[0-9]/.test(value)) {
      ctx.addIssue({
        code: "custom",
        message: translationKey("auth.validation.passwordNumber"),
      });
    }
  });

export const otpSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{6}$/u, translationKey("auth.validation.otpSixDigits"));

export const signInSchema = z.object({
  email: z.email(translationKey("auth.validation.invalidEmail")),
  password: z
    .string()
    .min(1, translationKey("auth.validation.passwordRequired")),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, translationKey("auth.validation.required")),
  email: z.email(translationKey("auth.validation.invalidEmail")),
  phone: z
    .string()
    .trim()
    .min(8, translationKey("auth.validation.invalidPhone")),
  password: passwordSchema,
});

export const passwordResetRequestSchema = z.object({
  email: z.email(translationKey("auth.validation.invalidEmail")),
});

export const passwordResetSubmissionSchema = z.object({
  email: z.email(translationKey("auth.validation.invalidEmail")),
  otp: otpSchema,
  password: passwordSchema,
});

/**
 * `activeOrganizationId` is the only org-scoping data the session carries —
 * role is deliberately NOT stored here. Unlike DONOR-B (one global role per
 * user), TMS roles live on `organization_memberships` (a user can be an admin
 * in one org and a teacher in another), so `orgProcedure` (Phase 2 step 5)
 * looks the role up per-request instead of trusting a cached session value.
 */
export const sessionSchema = z.object({
  sessionId: z.string(),
  exp: z.number(),
  hasPassword: z.boolean().optional().default(false),
  activeOrganizationId: z.string().optional().nullable(),
  user: z.object({
    id: z.string(),
    email: z.string().optional().nullable(),
    name: z.string().optional().nullable(),
    emailVerifiedAt: z.preprocess(
      (val) => (val instanceof Date ? val.toISOString() : val),
      z.string().optional().nullable(),
    ),
  }),
});
