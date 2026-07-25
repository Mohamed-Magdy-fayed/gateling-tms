import { z } from "zod";
import { translationKey } from "@/features/core/i18n/global";

export const listTraineesInput = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).default([]),
  globalFilter: z.string().optional(),
});

export const traineeMutationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(256, translationKey("forms.validation.max256")),
  phone: z
    .string()
    .trim()
    .max(32, translationKey("forms.validation.max128"))
    .optional()
    .or(z.literal("")),
  email: z
    .email(translationKey("auth.validation.invalidEmail"))
    .optional()
    .or(z.literal("")),
});

export const traineeUpdateSchema = traineeMutationSchema.extend({
  id: z.uuid(),
});

export const traineeDeleteSchema = z.object({
  id: z.uuid(),
});

export type ListTraineesInput = z.infer<typeof listTraineesInput>;
export type TraineeMutationInput = z.infer<typeof traineeMutationSchema>;
export type TraineeUpdateInput = z.infer<typeof traineeUpdateSchema>;
export type TraineeDeleteInput = z.infer<typeof traineeDeleteSchema>;
