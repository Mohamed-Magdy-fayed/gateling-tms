"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  ColumnPinningState,
  RowSelectionState,
  VisibilityState,
} from "@tanstack/react-table";
import { PlusIcon, UploadIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Trainee } from "@/drizzle/schema";
import {
  DataTable,
  type DataTableControlledState,
  DataTableExportButton,
  DataTablePagination,
  DataTableToolbar,
  DataTableViewOptions,
  EntityPageHeader,
  getEntityColumnPinning,
  useDataTable,
  useTableUrlState,
} from "@/features/core/data-table";
import { useTranslation } from "@/features/core/i18n/client";
import {
  EntityExportButton,
  EntityImportDialog,
} from "@/features/core/import/admin";
import { PlanLimitNotice } from "@/features/core/organizations/nextjs";
import { useTRPC } from "@/integrations/trpc/client";

import {
  buildTraineeColumns,
  TraineeDeleteDialog,
  TraineeFormDialog,
  type TraineeRowActionVariant,
} from "./components";

type RowAction = { row: Trainee; variant: TraineeRowActionVariant } | null;

export function TraineesTablePage() {
  const trpc = useTRPC();
  const { t, locale } = useTranslation();

  const {
    pagination,
    sorting,
    columnFilters,
    globalFilter,
    setPagination,
    setSorting,
    setColumnFilters,
    setGlobalFilter,
  } = useTableUrlState({ page: 1, perPage: 20 });

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(() =>
    getEntityColumnPinning(),
  );
  const [rowAction, setRowAction] = useState<RowAction>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const queryClient = useQueryClient();
  const importPreview = useMutation(
    trpc.trainees.importPreview.mutationOptions(),
  );
  const importCommit = useMutation(
    trpc.trainees.importCommit.mutationOptions(),
  );

  const listInput = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      perPage: pagination.pageSize,
      sorting,
      globalFilter: globalFilter || undefined,
    }),
    [globalFilter, pagination.pageIndex, pagination.pageSize, sorting],
  );

  const { data, isFetching } = useQuery({
    ...trpc.trainees.list.queryOptions(listInput),
    placeholderData: keepPreviousData,
  });

  // The server clamps an out-of-range requested page (e.g. after the last
  // row on it was deleted) — sync local state to whatever it actually served.
  useEffect(() => {
    if (data && data.page !== pagination.pageIndex + 1) {
      setPagination((prev) => ({ ...prev, pageIndex: data.page - 1 }));
    }
  }, [data, pagination.pageIndex, setPagination]);

  const controlled = useMemo<DataTableControlledState>(
    () => ({
      pagination,
      onPaginationChange: setPagination,
      sorting,
      onSortingChange: setSorting,
      columnFilters,
      onColumnFiltersChange: setColumnFilters,
      globalFilter,
      onGlobalFilterChange: setGlobalFilter,
      rowSelection,
      onRowSelectionChange: setRowSelection,
      columnVisibility,
      onColumnVisibilityChange: setColumnVisibility,
      columnPinning,
      onColumnPinningChange: setColumnPinning,
    }),
    [
      pagination,
      setPagination,
      sorting,
      setSorting,
      columnFilters,
      setColumnFilters,
      globalFilter,
      setGlobalFilter,
      rowSelection,
      columnVisibility,
      columnPinning,
    ],
  );

  const columns = useMemo(
    () => buildTraineeColumns({ locale, setRowAction, t }),
    [locale, t],
  );

  const {
    table,
    globalFilter: resolvedGlobalFilter,
    setGlobalFilter: setResolvedGlobalFilter,
  } = useDataTable({
    mode: "server",
    data: data?.rows ?? [],
    pageCount: data?.pageCount ?? 1,
    rowCount: data?.total ?? 0,
    columns,
    getRowId: (row) => row.id,
    controlled,
  });

  const closeRowAction = () => setRowAction(null);

  return (
    <div
      className={
        isFetching ? "space-y-4 opacity-80 transition-opacity" : "space-y-4"
      }
    >
      <EntityPageHeader title={t("trainees.title")} lead={t("trainees.lead")} />

      <PlanLimitNotice resource="students" />

      <DataTable
        table={table}
        toolbar={
          <DataTableToolbar
            table={table}
            globalFilter={resolvedGlobalFilter}
            onGlobalFilterChange={(value) => setResolvedGlobalFilter(value)}
            searchPlaceholder={t("trainees.searchHint")}
          >
            <DataTableExportButton
              table={table}
              getExportRow={(row) => row}
              exportFileName="trainees.csv"
            />
            <EntityExportButton
              entities={[
                { entity: "trainees", titleKey: "import.trainees.title" },
              ]}
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-8"
              onClick={() => setImportOpen(true)}
              aria-label={t("import.action")}
            >
              <UploadIcon className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              className="size-8"
              onClick={() => setCreateOpen(true)}
              aria-label={t("actions.create")}
            >
              <PlusIcon className="size-3.5" />
            </Button>
            <DataTableViewOptions table={table} />
          </DataTableToolbar>
        }
        footer={<DataTablePagination table={table} />}
      />

      <EntityImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        entity="trainees"
        onPreview={(input) => importPreview.mutateAsync(input)}
        onCommit={(rows) => importCommit.mutateAsync({ rows })}
        onImported={() =>
          queryClient.invalidateQueries({ queryKey: trpc.trainees.pathKey() })
        }
      />

      <TraineeFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <TraineeFormDialog
        open={rowAction?.variant === "edit"}
        onOpenChange={(open) => {
          if (!open) closeRowAction();
        }}
        trainee={rowAction?.variant === "edit" ? rowAction.row : null}
      />
      <TraineeDeleteDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={(open) => {
          if (!open) closeRowAction();
        }}
        trainee={rowAction?.variant === "delete" ? rowAction.row : null}
        onDeleted={closeRowAction}
      />
    </div>
  );
}
