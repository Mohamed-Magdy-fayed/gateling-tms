import {
    createTRPCRouter,
    protectedProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { fileFormSchema } from "@/features/content/schemas/file-schema";
import { deleteFiles, uploadFiles } from "@/services/firebase/actions";
import { FilesTable } from "@/server/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { getI18n } from "@/i18n/lib/get-translations";
import z from "zod";
import { getErrorMessage } from "@/features/data-table/lib/handle-error";
import { getMaterialFolderPath } from "@/features/content/actions/utils";

export const filesRouter = createTRPCRouter({
    create: protectedProcedure
        .input(fileFormSchema.extend({ materialId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { t } = await getI18n(ctx.locale)

            try {
                const materialFolderPath = await getMaterialFolderPath(input.materialId)

                const files = input.files.map(file => ({
                    createdBy: ctx.session.user.email,
                    materialId: input.materialId,
                    fileName: file.name,
                    size: file.size,
                    type: file.type,
                    path: `${materialFolderPath}/${file.name}`,
                }))

                console.log(input);

                await uploadFiles(materialFolderPath, input.files);

                const uploadedFiles = await ctx.db
                    .insert(FilesTable)
                    .values(files)
                    .returning()
                if (!uploadedFiles) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: t("error", { error: "Files creation failed" }) });

                return uploadedFiles
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: t("error", { error: error instanceof Error ? error.message : "An unexpected error occurred" }),
                });
            }
        }),
    getFile: protectedProcedure
        .input(z.string())
        .query(async ({ ctx, input }) => {
            const { t } = await getI18n(ctx.locale)

            try {
                const file = await ctx.db.query.FilesTable.findFirst({
                    where: and(
                        eq(FilesTable.id, input),
                    ),
                    with: {
                        MaterialsTable: {
                            with: {
                                LevelsTable: {
                                    with: {
                                        CoursesTable: {
                                            columns: { organizationId: true }
                                        },
                                    },
                                }
                            }
                        }
                    }
                })

                if (
                    !file ||
                    file.MaterialsTable.LevelsTable.CoursesTable.organizationId !== ctx.session.user.organizationId
                ) {
                    throw new TRPCError({ code: "NOT_FOUND", message: "File not found" });
                }

                return file;
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: t("error", { error: error instanceof Error ? error.message : "An unexpected error occurred" }),
                });
            }
        }),
    deleteFiles: protectedProcedure
        .input(z.object({ ids: z.array(z.string()) }))
        .mutation(async ({ ctx, input }) => {
            try {
                const files = await ctx.db.query.FilesTable.findMany({ where: inArray(FilesTable.id, input.ids) });
                await deleteFiles(files.map(file => file.path));

                await ctx.db.transaction(async (tx) => {
                    await tx.delete(FilesTable).where(inArray(FilesTable.id, input.ids));
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
