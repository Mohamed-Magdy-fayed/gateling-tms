import { FilesTable, type File as DBFile } from "@/server/db/schema";
import {
    createSearchParamsCache,
    parseAsArrayOf,
    parseAsInteger,
    parseAsString,
} from "nuqs/server";
import * as z from "zod";

import { getSortingStateParser } from "@/features/data-table/lib/parsers";

export const fileFormSchema = z.object({
    files: z.array(z.custom<File>((file) => file instanceof File, { message: "please upload at least one file!" })),
});

export type FileFormData = z.infer<typeof fileFormSchema>;

export const searchParamsCache = createSearchParamsCache({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    sort: getSortingStateParser<DBFile>().withDefault([
        { id: "createdAt", desc: true },
    ]),
    fileName: parseAsString.withDefault(""),
    createdAt: parseAsArrayOf(z.coerce.number()).withDefault([]),
});

export const filesTableKeys = Object.keys(FilesTable) as Array<keyof typeof FilesTable>;
export const getFilesZodSchema = z.object({
    page: z.number().int().default(1),
    perPage: z.number().int().default(10),
    sort: z.array(
        z.object({
            id: z.string(),
            desc: z.boolean(),
        })
    ).default([{ id: "createdAt", desc: true }]),
    fileName: z.string().default(""),
    createdAt: z.array(z.number()).default([]),
});

export type GetFilesSchema = Awaited<
    ReturnType<typeof searchParamsCache.parse>
>;
