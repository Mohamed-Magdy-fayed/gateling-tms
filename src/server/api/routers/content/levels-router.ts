import {
    createTRPCRouter,
    protectedProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { levelFormSchema } from "@/features/content/schemas/level-schema";
import { getLevelsZodSchema } from "@/features/content/schemas/level-schema";
import { LevelsTable } from "@/server/db/schema";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { getI18n } from "@/i18n/lib/get-translations";
import z from "zod";
import { getErrorMessage } from "@/features/data-table/lib/handle-error";

export const levelsRouter = createTRPCRouter({
    create: protectedProcedure
        .input(levelFormSchema.extend({ courseId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { t } = await getI18n(ctx.locale)

            try {
                const [level] = await ctx.db.insert(LevelsTable).values([{
                    name: input.name,
                    courseId: input.courseId,
                    createdBy: ctx.session.user.email,
                }]).returning()
                if (!level) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: t("error", { error: "Level creation failed" }) });

                return level
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: t("error", { error: error instanceof Error ? error.message : "An unexpected error occurred" }),
                });
            }
        }),
    update: protectedProcedure
        .input(levelFormSchema.extend({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            const { t } = await getI18n(ctx.locale)

            try {
                const [level] = await ctx.db.update(LevelsTable).set({
                    name: input.name,
                    updatedBy: ctx.session.user.email,
                }).where(inArray(LevelsTable.id, input.ids))

                return level
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: t("error", { error: error instanceof Error ? error.message : "An unexpected error occurred" }),
                });
            }
        }),
    getLevel: protectedProcedure
        .input(z.string())
        .query(async ({ ctx, input }) => {
            const { t } = await getI18n(ctx.locale)

            try {
                const level = await ctx.db.select().from(LevelsTable).where(eq(LevelsTable.id, input)).execute().then((res) => res[0]);
                if (!level) throw new TRPCError({ code: "NOT_FOUND", message: t("error", { error: "Level not found" }) });

                return level
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: t("error", { error: error instanceof Error ? error.message : "An unexpected error occurred" }),
                });
            }
        }),
    queryLevels: protectedProcedure
        .input(getLevelsZodSchema)
        .query(async ({ ctx, input }) => {
            try {
                const offset = (input.page - 1) * input.perPage;

                const where = and(
                    input.courseId ? eq(LevelsTable.courseId, input.courseId) : undefined,
                    input.name ? ilike(LevelsTable.name, `%${input.name}%`) : undefined,
                    input.createdBy ? ilike(LevelsTable.createdBy, `%${input.createdBy}%`) : undefined,
                    input.createdAt.length > 0
                        ? and(
                            input.createdAt[0]
                                ? gte(
                                    LevelsTable.createdAt,
                                    (() => {
                                        const date = new Date(input.createdAt[0]);
                                        date.setHours(0, 0, 0, 0);
                                        return date;
                                    })(),
                                )
                                : undefined,
                            input.createdAt[1]
                                ? lte(
                                    LevelsTable.createdAt,
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
                            const column = LevelsTable[item.id as keyof typeof LevelsTable] as PgColumn;
                            return item.desc ? desc(column) : asc(column);
                        })
                        : [asc(LevelsTable.createdAt)];

                const { data, total } = await ctx.db.transaction(async (tx) => {
                    const data = await tx
                        .select()
                        .from(LevelsTable)
                        .limit(input.perPage)
                        .offset(offset)
                        .where(where)
                        .orderBy(...orderBy);

                    const total = await tx
                        .select({
                            count: count(),
                        })
                        .from(LevelsTable)
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
            } catch (_err) {
                return { data: [], pageCount: 0 };
            }
        }),
    deleteLevels: protectedProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            try {
                await ctx.db.transaction(async (tx) => {
                    await tx.delete(LevelsTable).where(inArray(LevelsTable.id, input.ids));
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
