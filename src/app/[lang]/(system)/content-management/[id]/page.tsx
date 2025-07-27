import AdminHeader from "@/app/[lang]/(system)/_shared/admin-header";
import BackButton from "@/components/general/back-button";
import { MarkdownPartial } from "@/components/markdown/MarkdownPartial";
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import { Separator } from "@/components/ui/separator";
import { SidebarInset } from "@/components/ui/sidebar";
import { H3 } from "@/components/ui/typography";
import CourseActions from "@/features/content/components/course-page/course-actions";
import { CourseTabs } from "@/features/content/components/course-page/course-tabs";
import { getI18n } from "@/i18n/lib/get-translations";
import { api } from "@/trpc/server";
import { Suspense } from "react";

export default async function CoursePage({ params }: { params: Promise<{ id: string, lang: string }> }) {
    const { id, lang } = await params
    const { t } = await getI18n(lang)
    const { name, description } = await api.coursesRouter.getCourse(id);

    return (
        <>
            <AdminHeader
                title={
                    <div className="flex items-center gap-2">
                        <BackButton />
                        <H3>{name}</H3>
                    </div>
                }
                actions={<CourseActions />}
            />
            <Separator />
            <div className="space-y-4 p-4">
                <Suspense fallback="Loading...">
                    <CourseTabs courseId={id} />
                </Suspense>
                <MarkdownPartial
                    dialogTitle={name}
                    dialogMarkdown={<MarkdownRenderer source={description} />}
                    mainMarkdown={<MarkdownRenderer source={description} className="prose-sm" />}
                />
            </div>
        </>
    );
};
