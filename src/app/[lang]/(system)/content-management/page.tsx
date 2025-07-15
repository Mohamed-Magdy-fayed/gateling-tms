import { H3 } from "@/components/ui/typography";
import { CourseSheet } from "@/features/content/components/course-sheet";
import { CoursesClient } from "@/features/content/components/courses-client";
import { searchParamsCache } from "@/features/content/schema";
import { DataTableSkeleton } from "@/features/data-table/components/data-table-skeleton";
import { getI18n } from "@/i18n/lib/get-translations";
import { api } from "@/trpc/server";
import type { SearchParams } from "nuqs";
import { Suspense } from "react";

export default async function ContentPage({ params, searchParams }: { params: Promise<{ lang: string }>, searchParams: Promise<SearchParams>; }) {
    const { lang } = await params;
    const { t } = await getI18n(lang)

    const search = await searchParamsCache.parse(searchParams);

    const queryCourses = api.coursesRouter.queryCourses

    const promises = Promise.all([
        queryCourses({
            ...search,
        }),
    ]);

    return (
        <div className="p-4">
            <div className="flex w-full flex-col gap-4">
                <div className="flex justify-between">
                    <div className="flex flex-col gap-2">
                        <H3>{t("content.courseForm.courses")}</H3>
                    </div>
                </div>
                <Suspense
                    fallback={
                        <DataTableSkeleton
                            columnCount={5}
                            filterCount={2}
                            cellWidths={[
                                "10rem",
                                "10rem",
                                "6rem",
                                "6rem",
                                "6rem",
                            ]}
                            shrinkZero
                        />
                    }
                >
                    <CoursesClient promises={promises} />
                </Suspense>
            </div>
        </div>
    );
};
