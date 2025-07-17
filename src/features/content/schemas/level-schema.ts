import { LevelsTable, type Level } from "@/server/db/schema";
import {
    createSearchParamsCache,
    parseAsArrayOf,
    parseAsInteger,
    parseAsString,
} from "nuqs/server";
import * as z from "zod";

import { getSortingStateParser } from "@/features/data-table/lib/parsers";

export const levelFormSchema = z.object({
    name: z.string().min(1, 'level name is required'),
});

export type LevelFormData = z.infer<typeof levelFormSchema>;

export const searchParamsCache = createSearchParamsCache({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    sort: getSortingStateParser<Level>().withDefault([
        { id: "createdAt", desc: false },
    ]),
    name: parseAsString.withDefault(""),
    createdBy: parseAsString.withDefault(""),
    createdAt: parseAsArrayOf(z.coerce.number()).withDefault([]),
});

export const levelsTableKeys = Object.keys(LevelsTable) as Array<keyof typeof LevelsTable>;
export const getLevelsZodSchema = z.object({
    page: z.number().int().default(1),
    perPage: z.number().int().default(10),
    sort: z.array(
        z.object({
            id: z.string(),
            desc: z.boolean(),
        })
    ).default([{ id: "createdAt", desc: false }]),
    courseId: z.string().default(""),
    name: z.string().default(""),
    createdBy: z.string().default(""),
    createdAt: z.array(z.number()).default([]),
});

export type GetLevelsSchema = Awaited<
    ReturnType<typeof searchParamsCache.parse>
>;