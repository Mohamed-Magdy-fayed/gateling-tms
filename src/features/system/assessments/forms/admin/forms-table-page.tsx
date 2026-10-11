"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  ColumnPinningState,
  RowSelectionState,
  VisibilityState,
} from "@tanstack/react-table";
import { FileSpreadsheetIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { type Form, formStatusValues, formTypeValues } from "@/drizzle/schema";
import {
  DataTable,
  type DataTableControlledState,
  DataTableDateRangeFilter,
  DataTableExportButton,
  DataTableFacetedFilter,
  DataTablePagination,
  DataTableToolbar,
  DataTableViewOptions,
  dateRangeFilterBounds,
  EntityPageHeader,
  getEntityColumnPinning,
  selectedEnumFilterValues,
  useDataTable,
  useTableUrlState,
} from "@/features/core/data-table";
import { useTranslation } from "@/features/core/i18n/client";
import { GOOGLE_IMPORT_PATH } from "@/features/system/assessments/google-import/lib/redirect-codes";
import { useTRPC } from "@/integrations/trpc/client";

import {
  buildFormColumns,
  FormDeleteDialog,
  FormFormDialog,
  type FormRowActionVariant,
} from "./components";

type RowAction = { row: Form; variant: FormRowActionVariant } | null;

export function FormsTablePage() {
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

  const listInput = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      perPage: pagination.pageSize,
      sorting,
      globalFilter: globalFilter || undefined,
      types: selectedEnumFilterValues(columnFilters, "type", formTypeValues),
      statuses: selectedEnumFilterValues(
        columnFilters,
        "status",
        formStatusValues,
      ),
      createdAt: dateRangeFilterBounds(columnFilters, "createdAt"),
    }),
    [
      columnFilters,
      globalFilter,
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
    ],
  );

  const typeOptions = useMemo(
    () =>
      formTypeValues.map((type) => ({
        value: type,
        label: t(`assessments.typeOptions.${type}`),
      })),
    [t],
  );
  const statusOptions = useMemo(
    () =>
      formStatusValues.map((status) => ({
        value: status,
        label: t(`assessments.statusOptions.${status}`),
      })),
    [t],
  );

  const { data, isFetching } = useQuery(
    trpc.forms.list.queryOptions(listInput),
  );

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
    () => buildFormColumns({ locale, setRowAction, t }),
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <EntityPageHeader
          title={t("assessments.title")}
          lead={t("assessments.lead")}
        />
        {/* The Google connection lives on its own page — this is the only way
            in, so the sidebar keeps one Assessments entry. */}
        <Link
          href={GOOGLE_IMPORT_PATH}
          className={buttonVariants({ variant: "outline" })}
        >
          <FileSpreadsheetIcon className="size-3.5" />
          {t("assessments.importFromGoogle")}
        </Link>
      </div>

      <DataTable
        table={table}
        toolbar={
          <DataTableToolbar
            table={table}
            globalFilter={resolvedGlobalFilter}
            onGlobalFilterChange={(value) => setResolvedGlobalFilter(value)}
            searchPlaceholder={t("assessments.searchHint")}
            filterSlot={
              <>
                <DataTableFacetedFilter
                  column={table.getColumn("type")}
                  title={t("assessments.type")}
                  options={typeOptions}
                />
                <DataTableFacetedFilter
                  column={table.getColumn("status")}
                  title={t("assessments.status")}
                  options={statusOptions}
                />
                <DataTableDateRangeFilter
                  column={table.getColumn("createdAt")}
                  title={t("common.createdAt")}
                />
              </>
            }
          >
            <DataTableExportButton
              table={table}
              getExportRow={(row) => row}
              exportFileName="assessments.csv"
            />
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

      <FormFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <FormFormDialog
        open={rowAction?.variant === "edit"}
        onOpenChange={(open) => {
          if (!open) closeRowAction();
        }}
        form={rowAction?.variant === "edit" ? rowAction.row : null}
      />
      <FormDeleteDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={(open) => {
          if (!open) closeRowAction();
        }}
        form={rowAction?.variant === "delete" ? rowAction.row : null}
        onDeleted={closeRowAction}
      />
    </div>
  );
}
