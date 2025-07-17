"use client";

import type { Level } from "@/server/db/schema";
import type { DataTableRowAction } from "@/features/data-table/types/data-table";
import * as React from "react";

import { DataTableSortList } from "@/features/data-table/components/data-table-sort-list";
import { DataTableToolbar } from "@/features/data-table/components/data-table-toolbar";
import { DeleteLevelsDialog } from "./level-delete-dialog";
import { LevelsActionBar } from "./level-action-bar";
import { useLevelsColumns } from "./level-columns";
import { DataTable } from "@/features/data-table/components/data-table";
import { useDataTable } from "@/features/data-table/hooks/use-data-table";
import { LevelSheet } from "@/features/content/components/levels/level-sheet";
import { api } from "@/trpc/react";
import { useTranslation } from "@/i18n/useTranslation";
import { useParams, useSearchParams } from "next/navigation";
import { searchParamsCache } from "@/features/content/schemas/level-schema";

export function LevelsClient() {
    const { t } = useTranslation();

    const { id }: { id: string } = useParams();
    const searchParams = useSearchParams();
    const searchObj = Object.fromEntries(searchParams.entries());
    const search = searchParamsCache.parse(searchObj);

    const { data } = api.levelsRouter.queryLevels.useQuery({ ...search, courseId: id });

    const [rowAction, setRowAction] = React.useState<DataTableRowAction<Level> | null>(null);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);

    const columns = useLevelsColumns({ setRowAction })

    const { table } = useDataTable({
        data: data?.data ?? [],
        columns,
        pageCount: data?.pageCount ?? 0,
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
                actionBar={<LevelsActionBar table={table} />}
            >
                <DataTableToolbar table={table}>
                    <DataTableSortList table={table} align="end" />
                </DataTableToolbar>
            </DataTable>
            <LevelSheet
                open={rowAction?.variant === "update" || isCreateOpen}
                onOpenChange={(val) => (setRowAction(null), setIsCreateOpen(val))}
                level={rowAction?.row.original}
            />
            <DeleteLevelsDialog
                open={rowAction?.variant === "delete"}
                onOpenChange={(val) => (setRowAction(null), setIsCreateOpen(val))}
                levels={rowAction?.row.original ? [rowAction?.row.original] : []}
                showTrigger={false}
                onSuccess={() => rowAction?.row.toggleSelected(false)}
            />
        </>
    );
}
