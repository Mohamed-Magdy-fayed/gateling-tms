import BackButton from "@/components/general/back-button";
import { H3, Lead } from "@/components/ui/typography";
import { CourseTabs } from "@/features/content/components/course-page/course-tabs";
import { getI18n } from "@/i18n/lib/get-translations";
import { api } from "@/trpc/server";
import { Suspense } from "react";

export default async function CoursePage({ params }: { params: Promise<{ id: string, lang: string }> }) {
    const { id, lang } = await params
    const { t } = await getI18n(lang)
    const { name, LevelsTable } = await api.coursesRouter.getCourse(id);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4 p-4 justify-between">
                    <div className="flex items-center gap-2">
                        <BackButton />
                        <H3>{name}</H3>
                        <Lead>
                            {t("content.totalLevels", { count: LevelsTable.length })}
                        </Lead>
                    </div>
                </div>
            </div>
            <Suspense fallback="Loading...">
                <CourseTabs courseId={id} />
            </Suspense>
        </div>
    );
};
