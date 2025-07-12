import { H3 } from "@/components/ui/typography";
import CourseSheet from "@/featurs/content/components/course-sheet";
import { getI18n } from "@/i18n/lib/get-translations";
import { Suspense } from "react";

export default async function ContentPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const { t } = await getI18n(lang)

    return (
        <div className="p-4">
            <div className="flex w-full flex-col gap-4">
                <div className="flex justify-between">
                    <div className="flex flex-col gap-2">
                        <H3>{t("content.courseForm.courses")}</H3>
                    </div>
                    <Suspense>
                        <CourseSheet />
                    </Suspense>
                </div>
                {/* <CoursesClient /> */}
            </div>
        </div>
    );
};
