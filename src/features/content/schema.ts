import { CoursesTable, type Course } from "@/server/db/schema";
import {
    createSearchParamsCache,
    parseAsArrayOf,
    parseAsInteger,
    parseAsString,
} from "nuqs/server";
import * as z from "zod";

import { getSortingStateParser } from "@/features/data-table/lib/parsers";

export const courseFormSchema = z.object({
    name: z.string().min(1, 'Contact name is required'),
    description: z.string().min(1, 'Business name is required'),
    image: z.string().nullable().optional(),
});

export type CourseFormData = z.infer<typeof courseFormSchema>;

export const searchParamsCache = createSearchParamsCache({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    sort: getSortingStateParser<Course>().withDefault([
        { id: "createdAt", desc: true },
    ]),
    name: parseAsString.withDefault(""),
    createdAt: parseAsArrayOf(z.coerce.number()).withDefault([]),
});

export const coursesTableKeys = Object.keys(CoursesTable) as Array<keyof typeof CoursesTable>;
export const getCoursesZodSchema = z.object({
    page: z.number().int().default(1),
    perPage: z.number().int().default(10),
    sort: z.array(
        z.object({
            id: z.string(),
            desc: z.boolean(),
        })
    ).default([{ id: "createdAt", desc: true }]),
    name: z.string().default(""),
    createdAt: z.array(z.number()).default([]),
});

export type GetCoursesSchema = Awaited<
    ReturnType<typeof searchParamsCache.parse>
>;