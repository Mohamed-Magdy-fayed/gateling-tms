import { z } from "zod";
import { translationKey } from "@/features/core/i18n/global";

export const listCoursesInput = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).default([]),
  globalFilter: z.string().optional(),
});

export const courseMutationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(256, translationKey("forms.validation.max256")),
  description: z
    .string()
    .trim()
    .max(2000, translationKey("forms.validation.max2000"))
    .optional()
    .or(z.literal("")),
  thumbnailUrl: z.url().optional().or(z.literal("")).nullable(),
});

export const courseUpdateSchema = courseMutationSchema.extend({
  id: z.uuid(),
});

export const courseDeleteSchema = z.object({
  id: z.uuid(),
});

export type ListCoursesInput = z.infer<typeof listCoursesInput>;
export type CourseMutationInput = z.infer<typeof courseMutationSchema>;
export type CourseUpdateInput = z.infer<typeof courseUpdateSchema>;
export type CourseDeleteInput = z.infer<typeof courseDeleteSchema>;
