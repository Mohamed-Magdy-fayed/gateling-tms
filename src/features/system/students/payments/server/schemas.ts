import { z } from "zod";
import { paymentMethodValues } from "@/drizzle/schema";
import { translationKey } from "@/features/core/i18n/global";
import { idSchema } from "@/lib/id-schema";

export const listPaymentsInput = z.object({
  traineeId: idSchema,
});

// numeric(12, 2): ten integer digits, two decimals.
export const MAX_PAYMENT_AMOUNT = 9_999_999_999.99;

/**
 * Shared by the dialog form and the router, so — like every other mutation
 * schema in this module — no `.default()` and no `.transform()` (STATE.md
 * D82). The empty-string "none" the enrollment select submits and the
 * empty optional text fields are normalized to null in the mutation.
 *
 * `amount` is checked to the cent rather than with `.multipleOf(0.01)`,
 * which trips over binary floating point for ordinary inputs like 0.07.
 */
export const paymentMutationSchema = z.object({
  traineeId: idSchema,
  amount: z
    .number(translationKey("payments.validation.amount"))
    .positive(translationKey("payments.validation.amount"))
    .max(MAX_PAYMENT_AMOUNT, translationKey("payments.validation.amountMax"))
    .refine(
      (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6,
      translationKey("payments.validation.amountPrecision"),
    ),
  paidAt: z.iso.date(translationKey("payments.validation.date")),
  method: z.enum(paymentMethodValues),
  enrollmentId: z.union([idSchema, z.literal("")]).nullable(),
  reference: z
    .string()
    .trim()
    .max(128, translationKey("forms.validation.max128"))
    .optional()
    .or(z.literal("")),
  note: z
    .string()
    .trim()
    .max(1024, translationKey("forms.validation.max1024"))
    .optional()
    .or(z.literal("")),
});

export const paymentUpdateSchema = paymentMutationSchema.extend({
  id: idSchema,
});

export const paymentDeleteSchema = z.object({
  id: idSchema,
});

export type ListPaymentsInput = z.infer<typeof listPaymentsInput>;
export type PaymentMutationInput = z.infer<typeof paymentMutationSchema>;
export type PaymentUpdateInput = z.infer<typeof paymentUpdateSchema>;
export type PaymentDeleteInput = z.infer<typeof paymentDeleteSchema>;
