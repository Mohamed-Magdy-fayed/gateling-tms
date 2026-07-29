import { z } from "zod";
import { translationKey } from "@/features/core/i18n/global";

export const listZoomClientsInput = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).default([]),
  globalFilter: z.string().optional(),
});

export const zoomClientMutationSchema = z.object({
  // A label for the humans in the org ("Main licence", "Evening classes") —
  // the Zoom account it ends up bound to is whatever authorizes the connect.
  name: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(256, translationKey("forms.validation.max256")),
});

export const zoomClientIdSchema = z.object({
  id: z.uuid(),
});

export const zoomClientUpdateSchema = zoomClientMutationSchema.extend({
  id: z.uuid(),
});

export type ListZoomClientsInput = z.infer<typeof listZoomClientsInput>;
export type ZoomClientMutationInput = z.infer<typeof zoomClientMutationSchema>;
export type ZoomClientUpdateInput = z.infer<typeof zoomClientUpdateSchema>;
export type ZoomClientIdInput = z.infer<typeof zoomClientIdSchema>;
