import { z } from "zod";
import { translationKey } from "@/features/core/i18n/global";

export const contactMessageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(128, translationKey("forms.validation.max128")),
  email: z
    .string()
    .trim()
    .min(1, translationKey("auth.validation.required"))
    .email(translationKey("auth.validation.invalidEmail")),
  subject: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(128, translationKey("forms.validation.max128")),
  message: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(2000, translationKey("forms.validation.max2000")),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
