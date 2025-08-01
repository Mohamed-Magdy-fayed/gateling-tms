import {
    createTRPCRouter,
    protectedProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { courseFormSchema } from "@/features/content/schemas/course-schema";
import { getFileDownloadURL, getStoragePathFromUrl, moveFile } from "@/services/firebase/actions";
import { getCoursesZodSchema } from "@/features/content/schemas/course-schema";
import { CoursesTable } from "@/server/db/schema";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { getI18n } from "@/i18n/lib/get-translations";
import z from "zod";
import { getErrorMessage } from "@/features/data-table/lib/handle-error";
import type { get } from "http";

export const coursesRouter = createTRPCRouter({
    create: protectedProcedure
        .input(courseFormSchema)
        .mutation(async ({ ctx, input }) => {
            const { t } = await getI18n(ctx.locale)

            try {
                const [course] = await ctx.db
                    .insert(CoursesTable)
                    .values([{
                        organizationId: ctx.session.user.organizationId,
                        name: input.name,
                        description: input.description,
                        image: input.image,
                        createdBy: ctx.session.user.email,
                    }])
                    .returning()
                if (!course) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: t("error", { error: "Course creation failed" }) });

                if (input.image) {
                    const path = getStoragePathFromUrl(input.image)
                    if (!path) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: t("error", { error: "image error" }) });

                    const newPath = `/courses/${course.id}/${path.split("temp/")[1]}.`
                    await moveFile(path, newPath)

                    const newUrl = await getFileDownloadURL(newPath)
                    await ctx.db.update(CoursesTable).set({ image: newUrl }).where(eq(CoursesTable.id, course.id))
                }

                return course
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: t("error", { error: error instanceof Error ? error.message : "An unexpected error occurred" }),
                });
            }
        }),
    update: protectedProcedure
        .input(courseFormSchema.extend({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            const { t } = await getI18n(ctx.locale)

            try {
                const [course] = await ctx.db.update(CoursesTable).set({
                    name: input.name,
                    description: input.description,
                    image: input.image,
                    updatedBy: ctx.session.user.email,
                }).where(inArray(CoursesTable.id, input.ids))

                return course
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: t("error", { error: error instanceof Error ? error.message : "An unexpected error occurred" }),
                });
            }
        }),
    getCourse: protectedProcedure
        .input(z.string())
        .query(async ({ ctx, input }) => {
            const { t } = await getI18n(ctx.locale)

            try {
                const course = await ctx.db.query.CoursesTable.findFirst({
                    where: and(
                        eq(CoursesTable.id, input),
                        eq(CoursesTable.organizationId, ctx.session.user.organizationId),
                    ),
                    with: {
                        LevelsTable: {
                            columns: {
                                id: true,
                            },
                        }
                    }
                })

                if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });

                return course;
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: t("error", { error: error instanceof Error ? error.message : "An unexpected error occurred" }),
                });
            }
        }),
    queryCourses: protectedProcedure
        .input(getCoursesZodSchema)
        .query(async ({ ctx, input }) => {

            try {
                const offset = (input.page - 1) * input.perPage;

                const where = and(
                    eq(CoursesTable.organizationId, ctx.session.user.organizationId),
                    input.name ? ilike(CoursesTable.name, `%${input.name}%`) : undefined,
                    input.createdAt.length > 0
                        ? and(
                            input.createdAt[0]
                                ? gte(
                                    CoursesTable.createdAt,
                                    (() => {
                                        const date = new Date(input.createdAt[0]);
                                        date.setHours(0, 0, 0, 0);
                                        return date;
                                    })(),
                                )
                                : undefined,
                            input.createdAt[1]
                                ? lte(
                                    CoursesTable.createdAt,
                                    (() => {
                                        const date = new Date(input.createdAt[1]);
                                        date.setHours(23, 59, 59, 999);
                                        return date;
                                    })(),
                                )
                                : undefined,
                        )
                        : undefined,
                );

                const orderBy =
                    input.sort.length > 0
                        ? input.sort.map((item) => {
                            const column = CoursesTable[item.id as keyof typeof CoursesTable] as PgColumn;
                            return item.desc ? desc(column) : asc(column);
                        })
                        : [asc(CoursesTable.createdAt)];

                const { data, total } = await ctx.db.transaction(async (tx) => {
                    const data = await tx
                        .select()
                        .from(CoursesTable)
                        .limit(input.perPage)
                        .offset(offset)
                        .where(where)
                        .orderBy(...orderBy);

                    const total = await tx
                        .select({
                            count: count(),
                        })
                        .from(CoursesTable)
                        .where(where)
                        .execute()
                        .then((res) => res[0]?.count ?? 0);

                    return {
                        data,
                        total,
                    };
                });

                const pageCount = Math.ceil(total / input.perPage);
                return { data, pageCount };
            } catch (error) {
                return { data: [], pageCount: 0, error: getErrorMessage(error) };
            }
        }),
    deleteCourses: protectedProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            try {
                await ctx.db.transaction(async (tx) => {
                    await tx.delete(CoursesTable).where(inArray(CoursesTable.id, input.ids));
                });

                return {
                    data: null,
                    error: null,
                };
            } catch (err) {
                return {
                    data: null,
                    error: getErrorMessage(err),
                };
            }
        })
});
