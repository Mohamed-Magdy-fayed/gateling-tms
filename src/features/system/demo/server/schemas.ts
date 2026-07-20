import { z } from "zod";
import { translationKey } from "@/features/core/i18n/global";

export const listDemoItemsInput = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).default([]),
  globalFilter: z.string().optional(),
});

export const demoItemMutationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(128, translationKey("forms.validation.max128")),
  isActive: z.boolean(),
});

export const demoItemUpdateSchema = demoItemMutationSchema.extend({
  id: z.uuid(),
});

export const demoItemDeleteSchema = z.object({
  id: z.uuid(),
});

export type ListDemoItemsInput = z.infer<typeof listDemoItemsInput>;
export type DemoItemMutationInput = z.infer<typeof demoItemMutationSchema>;
export type DemoItemUpdateInput = z.infer<typeof demoItemUpdateSchema>;
export type DemoItemDeleteInput = z.infer<typeof demoItemDeleteSchema>;
