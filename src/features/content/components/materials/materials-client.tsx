"use client";

import type { Material } from "@/server/db/schema";
import type { DataTableRowAction } from "@/features/data-table/types/data-table";
import * as React from "react";

import { DataTableSortList } from "@/features/data-table/components/data-table-sort-list";
import { DataTableToolbar } from "@/features/data-table/components/data-table-toolbar";
import { DeleteMaterialsDialog } from "./materials-delete-dialog";
import { MaterialsActionBar } from "./material-action-bar";
import { useMaterialsColumns, type MaterialsRowAction } from "./materials-columns";
import { DataTable } from "@/features/data-table/components/data-table";
import { useDataTable } from "@/features/data-table/hooks/use-data-table";
import { MaterialSheet } from "@/features/content/components/materials/materials-sheet";
import { api } from "@/trpc/react";
import { useTranslation } from "@/i18n/useTranslation";
import { useParams, useSearchParams } from "next/navigation";
import { searchParamsCache } from "@/features/content/schemas/material-schema";
import { DataTableSkeleton } from "@/features/data-table/components/data-table-skeleton";
import { FilesSheet } from "@/features/content/components/files/files-sheet";

export function MaterialsClient() {
    const { t } = useTranslation();

    const { id }: { id: string } = useParams();
    const searchParams = useSearchParams();
    const searchObj = Object.fromEntries(searchParams.entries());
    const search = searchParamsCache.parse(searchObj);

    const { data, isRefetching, isPending, error, isError } = api.materialsRouter.queryMaterials.useQuery({ ...search, courseId: id });

    const [rowAction, setRowAction] = React.useState<MaterialsRowAction<Material> | null>(null);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);

    const levelCounts: Record<string, { value: string; label: string; count: number }> = {};

    (data?.data ?? []).forEach(item => {
        if (!item.levelId) return;
        if (!levelCounts[item.levelId]) {
            levelCounts[item.levelId] = {
                value: item.levelId,
                label: item.levelName ?? "",
                count: 1,
            };
        } else {
            levelCounts[item.levelId]!.count += 1;
        }
    });

    const options = Object.values(levelCounts);

    const columns = useMaterialsColumns({
        setRowAction,
        options,
    });

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

    if (isPending) return <DataTableSkeleton columnCount={7} />;
    if (isError && error) return <DataTable table={table} error={error.message} />;

    return (
        <>
            <DataTable
                table={table}
                actionBar={<MaterialsActionBar table={table} />}
            >
                <DataTableToolbar table={table}>
                    <DataTableSortList table={table} align="end" />
                </DataTableToolbar>
            </DataTable>
            <FilesSheet materialId={rowAction?.row.original.id || ""} open={rowAction?.variant === "files"} onOpenChange={(val) => (setRowAction(null), setIsCreateOpen(val))} />
            <MaterialSheet
                open={rowAction?.variant === "update" || isCreateOpen}
                onOpenChange={(val) => (setRowAction(null), setIsCreateOpen(val))}
                material={rowAction?.row.original}
            />
            <DeleteMaterialsDialog
                open={rowAction?.variant === "delete"}
                onOpenChange={(val) => (setRowAction(null), setIsCreateOpen(val))}
                materials={rowAction?.row.original ? [rowAction?.row.original] : []}
                showTrigger={false}
                onSuccess={() => rowAction?.row.toggleSelected(false)}
            />
        </>
    );
}
