import { MaterialsTable, type Material } from "@/server/db/schema";
import {
    createSearchParamsCache,
    parseAsArrayOf,
    parseAsInteger,
    parseAsString,
} from "nuqs/server";
import * as z from "zod";

import { getSortingStateParser } from "@/features/data-table/lib/parsers";

export const materialFormSchema = z.object({
    levelId: z.string().min(1, 'Please select a level'),
    title: z.string().min(1, 'material title is required'),
    subtitle: z.string(),
    description: z.string(),
    order: z.number(),
});

export type MaterialFormData = z.infer<typeof materialFormSchema>;

export const searchParamsCache = createSearchParamsCache({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    sort: getSortingStateParser<Material>().withDefault([
        { id: "createdAt", desc: false },
    ]),
    title: parseAsString.withDefault(""),
    subtitle: parseAsString.withDefault(""),
    description: parseAsString.withDefault(""),
    levelIds: parseAsArrayOf(z.string()).withDefault([]),
    order: parseAsArrayOf(z.coerce.number()).withDefault([]),
    createdBy: parseAsString.withDefault(""),
    createdAt: parseAsArrayOf(z.coerce.number()).withDefault([]),
});

export const materialsTableKeys = Object.keys(MaterialsTable) as Array<keyof typeof MaterialsTable>;
export const getMaterialsZodSchema = z.object({
    page: z.number().int().default(1),
    perPage: z.number().int().default(10),
    sort: z.array(
        z.object({
            id: z.string(),
            desc: z.boolean(),
        })
    ).default([{ id: "createdAt", desc: false }]),
    levelIds: z.array(z.string()).default([]),
    title: z.string().default(""),
    subtitle: z.string().default(""),
    description: z.string().default(""),
    order: z.array(z.coerce.number().optional()),
    createdBy: z.string().default(""),
    createdAt: z.array(z.number()).default([]),
});

export type GetMaterialsSchema = Awaited<
    ReturnType<typeof searchParamsCache.parse>
>;