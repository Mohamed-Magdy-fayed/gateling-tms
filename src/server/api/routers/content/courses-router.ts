import {
    createTRPCRouter,
    protectedProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { getI18n } from "@/i18n/lib/get-translations";
import { courseFormSchema } from "@/featurs/content/schema";
import { createCourse, updateCourse } from "@/featurs/content/actions/crud";
import { getFileDownloadURL, getStoragePathFromUrl, moveFile } from "@/services/firebase/actions";

export const coursesRouter = createTRPCRouter({
    create: protectedProcedure
        .input(courseFormSchema)
        .mutation(async ({ ctx, input }) => {
            const { t } = await getI18n(ctx.locale)
            console.log(ctx.session.user);
            
            try {
                const [course] = await createCourse([{
                    organizationId: ctx.session.user.organizationId,
                    name: input.name,
                    description: input.description,
                    image: input.image,
                }])
                if (!course) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: t("error", { error: "Course creation failed" }) });

                if (input.image) {
                    const path = getStoragePathFromUrl(input.image)
                    if (!path) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: t("error", { error: "image error" }) });

                    const newPath = `/${course.id}/${path.split("temp/")[1]}.`
                    await moveFile(path, newPath)

                    const newUrl = await getFileDownloadURL(newPath)
                    await updateCourse({ ids: [course.id], image: newUrl })
                }

                return course
            } catch (error) {
                if (error instanceof Error && error.message.includes("duplicate key")) throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: t("errors.emailExists"),
                });

                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: t("error", { error: error instanceof Error ? error.message : "An unexpected error occurred" }),
                });
            }
        }),
});
