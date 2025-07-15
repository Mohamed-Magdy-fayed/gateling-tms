"use client";

import type { Course } from "@/server/db/schema";
import type { DataTableRowAction } from "@/features/data-table/types/data-table";
import * as React from "react";

import { DataTableSortList } from "@/features/data-table/components/data-table-sort-list";
import { DataTableToolbar } from "@/features/data-table/components/data-table-toolbar";
import { DeleteCoursesDialog } from "./courses-delete-dialog";
import { CoursesActionBar } from "./courses-action-bar";
import { useCoursesColumns } from "./courses-columns";
import { DataTable } from "@/features/data-table/components/data-table";
import { useDataTable } from "@/features/data-table/hooks/use-data-table";
import { CourseSheet } from "@/features/content/components/course-sheet";
import type { api } from "@/trpc/server";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

interface CoursesClientProps {
    promises: Promise<
        [
            Awaited<ReturnType<typeof api.coursesRouter.queryCourses>>,
        ]
    >;
}

export function CoursesClient({ promises }: CoursesClientProps) {
    const { t } = useTranslation();

    const [
        { data, pageCount },
    ] = React.use(promises);

    const [rowAction, setRowAction] = React.useState<DataTableRowAction<Course> | null>(null);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);

    const columns = useCoursesColumns({ setRowAction })

    const { table } = useDataTable({
        data,
        columns,
        pageCount,
        initialState: {
            sorting: [{ id: "createdAt", desc: true }],
            columnPinning: { right: ["actions"] },
        },
        getRowId: (originalRow) => originalRow.id,
        shallow: false,
        clearOnDefault: true,
    });

    return (
        <>
            <DataTable
                table={table}
                actionBar={<CoursesActionBar table={table} />}
            >
                <div className="p-1 ml-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCreateOpen(true)}
                    >
                        <PlusIcon />
                        {t("content.courseForm.create")}
                    </Button>
                </div>
                <DataTableToolbar table={table}>
                    <DataTableSortList table={table} align="end" />
                </DataTableToolbar>
            </DataTable>
            <CourseSheet
                open={rowAction?.variant === "update" || isCreateOpen}
                onOpenChange={(val) => (setRowAction(null), setIsCreateOpen(val))}
                course={rowAction?.row.original ?? null}
            />
            <DeleteCoursesDialog
                open={rowAction?.variant === "delete"}
                onOpenChange={(val) => (setRowAction(null), setIsCreateOpen(val))}
                courses={rowAction?.row.original ? [rowAction?.row.original] : []}
                showTrigger={false}
                onSuccess={() => rowAction?.row.toggleSelected(false)}
            />
        </>
    );
}
