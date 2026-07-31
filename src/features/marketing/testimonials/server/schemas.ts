import { z } from "zod";
import { translationKey } from "@/features/core/i18n/global";

export const MAX_PUBLIC_TESTIMONIALS = 24;

export const testimonialSubmitSchema = z.object({
  quote: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(1024, translationKey("forms.validation.max1024")),
  authorName: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(128, translationKey("forms.validation.max128")),
  authorRole: z
    .string()
    .trim()
    .max(128, translationKey("forms.validation.max128"))
    .optional()
    .or(z.literal("")),
  // Already-uploaded image URL — the file itself goes through the existing
  // uploads router, which is what enforces the org's storage budget.
  imageUrl: z.url().max(512).optional().or(z.literal("")),
  // The author's own consent to publication. False is a legitimate submission:
  // it stores the feedback for Gateling to read without publishing it. Not
  // `.default(false)` — a default would make the field optional on the way in,
  // which the form's validator can't express, and "unspecified consent" is a
  // state this field should never have anyway.
  isPublic: z.boolean(),
});

export const showcaseConsentSchema = z.object({
  consented: z.boolean(),
});

export const listPublicTestimonialsInput = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_PUBLIC_TESTIMONIALS)
    .default(MAX_PUBLIC_TESTIMONIALS),
});

export type TestimonialSubmitInput = z.infer<typeof testimonialSubmitSchema>;
export type ShowcaseConsentInput = z.infer<typeof showcaseConsentSchema>;
export type ListPublicTestimonialsInput = z.infer<
  typeof listPublicTestimonialsInput
>;
