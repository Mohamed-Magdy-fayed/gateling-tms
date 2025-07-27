import AdminHeader from "@/app/[lang]/(system)/_shared/admin-header";
import BackButton from "@/components/general/back-button";
import { MarkdownPartial } from "@/components/markdown/MarkdownPartial";
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import { Separator } from "@/components/ui/separator";
import { H3, Lead } from "@/components/ui/typography";
import CourseActions from "@/features/content/components/course-page/course-actions";
import { FilesClient } from "@/features/content/components/files/files-client";
import { getI18n } from "@/i18n/lib/get-translations";
import { api } from "@/trpc/server";
import { Suspense } from "react";

export default async function MaterialsPage({ params }: { params: Promise<{ id: string, lang: string, materialId: string }> }) {
    const { lang, materialId } = await params
    const { t } = await getI18n(lang)
    const { material: { title, description }, filesCount } = await api.materialsRouter.getMaterial(materialId);

    return (
        <>
            <AdminHeader
                title={
                    <div className="flex items-center gap-2">
                        <BackButton />
                        <H3>{title}</H3>
                        <Lead>{filesCount}</Lead>
                    </div>
                }
                actions={<CourseActions />}
            />
            <Separator />
            <div className="space-y-4 p-4">
                <Suspense fallback="Loading...">
                    <FilesClient />
                </Suspense>
                <MarkdownPartial
                    dialogTitle={title}
                    dialogMarkdown={<MarkdownRenderer source={description ?? ""} />}
                    mainMarkdown={<MarkdownRenderer source={description ?? ""} className="prose-sm" />}
                />
            </div>
        </>
    );
};
