"use client";

import type { File } from "@/server/db/schema";
import type { DataTableRowAction } from "@/features/data-table/types/data-table";
import * as React from "react";

import { DataTableSortList } from "@/features/data-table/components/data-table-sort-list";
import { DataTableToolbar } from "@/features/data-table/components/data-table-toolbar";
import { DeleteFilesDialog } from "./files-delete-dialog";
import { FilesActionBar } from "./files-action-bar";
import { useFilesColumns } from "./files-columns";
import { DataTable } from "@/features/data-table/components/data-table";
import { useDataTable } from "@/features/data-table/hooks/use-data-table";
import { FilesSheet } from "@/features/content/components/files/files-sheet";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { useParams, useSearchParams } from "next/navigation";
import { searchParamsCache } from "@/features/content/schemas/file-schema";
import { api } from "@/trpc/react";

export function FilesClient() {
    const { t } = useTranslation();

    const { materialId }: { materialId: string } = useParams();
    const searchParams = useSearchParams();
    const searchObj = Object.fromEntries(searchParams.entries());
    const search = searchParamsCache.parse(searchObj);

    const { data } = api.filesRouter.queryFiles.useQuery({ ...search, materialId });

    const [rowAction, setRowAction] = React.useState<DataTableRowAction<File> | null>(null);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);

    const columns = useFilesColumns({ setRowAction })

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
                error={data?.error}
                table={table}
                actionBar={<FilesActionBar table={table} />}
            >
                <div className="p-1 ml-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCreateOpen(true)}
                    >
                        <PlusIcon />
                        {t("content.fileForm.create")}
                    </Button>
                </div>
                <DataTableToolbar table={table}>
                    <DataTableSortList table={table} align="end" />
                </DataTableToolbar>
            </DataTable>
            <FilesSheet
                open={rowAction?.variant === "update" || isCreateOpen}
                onOpenChange={(val) => (setRowAction(null), setIsCreateOpen(val))}
                file={rowAction?.row.original ?? null}
            />
            <DeleteFilesDialog
                open={rowAction?.variant === "delete"}
                onOpenChange={(val) => (setRowAction(null), setIsCreateOpen(val))}
                files={rowAction?.row.original ? [rowAction?.row.original] : []}
                showTrigger={false}
                onSuccess={() => rowAction?.row.toggleSelected(false)}
            />
        </>
    );
}
