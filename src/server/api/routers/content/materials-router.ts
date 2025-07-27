import {
    createTRPCRouter,
    protectedProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { materialFormSchema } from "@/features/content/schemas/material-schema";
import { getMaterialsZodSchema } from "@/features/content/schemas/material-schema";
import { CoursesTable, FilesTable, LevelsTable, MaterialsTable } from "@/server/db/schema";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { getI18n } from "@/i18n/lib/get-translations";
import z from "zod";
import { getErrorMessage } from "@/features/data-table/lib/handle-error";
import { uploadFiles } from "@/services/firebase/actions";

export const materialsRouter = createTRPCRouter({
    create: protectedProcedure
        .input(materialFormSchema)
        .mutation(async ({ ctx, input }) => {
            const { t } = await getI18n(ctx.locale)

            try {
                const course = await ctx.db.query.CoursesTable.findFirst({
                    with: { LevelsTable: { where: eq(LevelsTable.id, input.levelId) } },
                })
                if (!course) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: t("error", { error: "Incorrect input!" })
                    });
                }

                const [material] = await ctx.db.insert(MaterialsTable).values([{
                    title: input.title,
                    subtitle: input.subtitle,
                    description: input.description,
                    order: input.order,
                    levelId: input.levelId,
                    createdBy: ctx.session.user.email,
                }]).returning();
                if (!material) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: t("error", { error: "Material creation failed" }) });

                return material;
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: t("error", { error: error instanceof Error ? error.message : "An unexpected error occurred" }),
                });
            }
        }),
    update: protectedProcedure
        .input(materialFormSchema.extend({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            const { t } = await getI18n(ctx.locale)

            try {
                const [material] = await ctx.db.update(MaterialsTable).set({
                    title: input.title,
                    subtitle: input.subtitle,
                    description: input.description,
                    order: input.order,
                    updatedBy: ctx.session.user.email,
                }).where(inArray(MaterialsTable.id, input.ids))

                return material
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: t("error", { error: error instanceof Error ? error.message : "An unexpected error occurred" }),
                });
            }
        }),
    getMaterial: protectedProcedure
        .input(z.string())
        .query(async ({ ctx, input }) => {
            const { t } = await getI18n(ctx.locale)
            try {
                const material = await ctx.db
                    .select()
                    .from(MaterialsTable)
                    .where(eq(MaterialsTable.id, input))
                    .execute()
                    .then(res => res[0]);
                if (!material) throw new TRPCError({ code: "NOT_FOUND", message: t("error", { error: "Material not found" }) });

                const filesCount = await ctx.db
                    .select({ count: count() })
                    .from(FilesTable)
                    .where(eq(FilesTable.materialId, input))
                    .execute()
                    .then(res => res[0]?.count ?? 0);

                return { material, filesCount };
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: t("error", { error: error instanceof Error ? error.message : "An unexpected error occurred" }),
                });
            }
        }),
    queryMaterials: protectedProcedure
        .input(getMaterialsZodSchema.extend({ courseId: z.string() }))
        .query(async ({ ctx, input }) => {
            try {
                const offset = (input.page - 1) * input.perPage;

                const where = and(
                    eq(LevelsTable.courseId, input.courseId),
                    input.levelIds.length > 0 ? inArray(MaterialsTable.levelId, input.levelIds) : undefined,
                    input.title ? ilike(MaterialsTable.title, `%${input.title}%`) : undefined,
                    input.subtitle ? ilike(MaterialsTable.subtitle, `%${input.subtitle}%`) : undefined,
                    input.description ? ilike(MaterialsTable.description, `%${input.description}%`) : undefined,
                    input.order.length > 0
                        ? and(
                            input.order[0]
                                ? gte(MaterialsTable.order, input.order[0])
                                : undefined,
                            input.order[1]
                                ? lte(MaterialsTable.order, input.order[1])
                                : undefined,
                        )
                        : undefined,
                    input.createdBy ? ilike(MaterialsTable.createdBy, `%${input.createdBy}%`) : undefined,
                    input.createdAt.length > 0
                        ? and(
                            input.createdAt[0]
                                ? gte(
                                    MaterialsTable.createdAt,
                                    (() => {
                                        const date = new Date(input.createdAt[0]);
                                        date.setHours(0, 0, 0, 0);
                                        return date;
                                    })(),
                                )
                                : undefined,
                            input.createdAt[1]
                                ? lte(
                                    MaterialsTable.createdAt,
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
                            const column = MaterialsTable[item.id as keyof typeof MaterialsTable] as PgColumn;
                            return item.desc ? desc(column) : asc(column);
                        })
                        : [asc(MaterialsTable.createdAt)];

                const { data, total } = await ctx.db.transaction(async (tx) => {
                    const data = await tx
                        .select({
                            id: MaterialsTable.id,
                            createdAt: MaterialsTable.createdAt,
                            updatedAt: MaterialsTable.updatedAt,
                            createdBy: MaterialsTable.createdBy,
                            updatedBy: MaterialsTable.updatedBy,
                            title: MaterialsTable.title,
                            subtitle: MaterialsTable.subtitle,
                            description: MaterialsTable.description,
                            order: MaterialsTable.order,
                            levelId: MaterialsTable.levelId,
                            levelName: LevelsTable.name,
                        })
                        .from(MaterialsTable)
                        .leftJoin(LevelsTable, eq(MaterialsTable.levelId, LevelsTable.id))
                        .where(where)
                        .limit(input.perPage)
                        .offset(offset)
                        .orderBy(...orderBy)
                        .execute()
                        .then((rows) => rows.map(row => row));

                    const total = await tx
                        .select({
                            count: count(),
                        })
                        .from(MaterialsTable)
                        .leftJoin(LevelsTable, eq(MaterialsTable.levelId, LevelsTable.id))
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
    deleteMaterials: protectedProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            try {
                await ctx.db.transaction(async (tx) => {
                    await tx.delete(MaterialsTable).where(inArray(MaterialsTable.id, input.ids));
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
        }),
});
