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
import { enrollmentStatusValues } from "@/drizzle/schema";
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
  selectedFilterValues,
  useDataTable,
  useTableUrlState,
} from "@/features/core/data-table";
import { useTranslation } from "@/features/core/i18n/client";
import {
  EntityExportButton,
  EntityImportDialog,
} from "@/features/core/import/admin";
import {
  BRANCH_COLUMN_ID,
  useBranchListColumn,
  useImportBranch,
} from "@/features/core/organizations/nextjs";
import { useTRPC } from "@/integrations/trpc/client";
import {
  buildEnrollmentColumns,
  EnrollmentDeleteDialog,
  EnrollmentFormDialog,
  type EnrollmentListRow,
  type EnrollmentRowActionVariant,
  EnrollmentStatusDialog,
} from "./components";

type RowAction = {
  row: EnrollmentListRow;
  variant: EnrollmentRowActionVariant;
} | null;

export function EnrollmentsTablePage() {
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
  // Imported rows go into one branch, picked here on "All branches".
  const importBranch = useImportBranch();
  const importPreview = useMutation(
    trpc.enrollments.importPreview.mutationOptions(),
  );
  const importCommit = useMutation(
    trpc.enrollments.importCommit.mutationOptions(),
  );

  const baseColumns = useMemo(
    () => buildEnrollmentColumns({ locale, setRowAction, t }),
    [locale, t],
  );
  // Branch column + filter, on "All branches" only.
  const branchList = useBranchListColumn(baseColumns);

  const listInput = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      perPage: pagination.pageSize,
      sorting,
      globalFilter: globalFilter || undefined,
      branchIds: branchList.branchIdsFilter(columnFilters),
      statuses: selectedEnumFilterValues(
        columnFilters,
        "status",
        enrollmentStatusValues,
      ),
      // The course filter holds ids even though its column shows names — the
      // server filters on the id column.
      courseIds: selectedFilterValues(columnFilters, "courseName"),
      createdAt: dateRangeFilterBounds(columnFilters, "createdAt"),
    }),
    [
      branchList,
      columnFilters,
      globalFilter,
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
    ],
  );

  const { data: courses } = useQuery(
    trpc.courses.list.queryOptions({ page: 1, perPage: 100, sorting: [] }),
  );
  const statusOptions = useMemo(
    () =>
      enrollmentStatusValues.map((status) => ({
        value: status,
        label: t(`enrollments.statusOptions.${status}`),
      })),
    [t],
  );
  const courseOptions = useMemo(
    () =>
      (courses?.rows ?? []).map((course) => ({
        value: course.id,
        label: course.name,
      })),
    [courses],
  );

  const { data, isFetching } = useQuery({
    ...trpc.enrollments.list.queryOptions(listInput),
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

  const columns = branchList.columns;

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
      <EntityPageHeader
        title={t("enrollments.title")}
        lead={t("enrollments.lead")}
      />

      <DataTable
        table={table}
        toolbar={
          <DataTableToolbar
            table={table}
            globalFilter={resolvedGlobalFilter}
            onGlobalFilterChange={(value) => setResolvedGlobalFilter(value)}
            searchPlaceholder={t("enrollments.searchHint")}
            filterSlot={
              <>
                {branchList.show ? (
                  <DataTableFacetedFilter
                    column={table.getColumn(BRANCH_COLUMN_ID)}
                    title={t("organizations.branches.column")}
                    options={branchList.options}
                  />
                ) : null}
                <DataTableFacetedFilter
                  column={table.getColumn("status")}
                  title={t("enrollments.status")}
                  options={statusOptions}
                />
                <DataTableFacetedFilter
                  column={table.getColumn("courseName")}
                  title={t("enrollments.course")}
                  options={courseOptions}
                />
                <DataTableDateRangeFilter
                  column={table.getColumn("createdAt")}
                  title={t("enrollments.enrolledAt")}
                />
              </>
            }
          >
            <DataTableExportButton
              table={table}
              getExportRow={(row) => row}
              exportFileName="enrollments.csv"
            />
            <EntityExportButton
              entities={[
                { entity: "enrollments", titleKey: "import.enrollments.title" },
              ]}
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-8"
              onClick={() => setImportOpen(true)}
              aria-label={t("import.enrollments.action")}
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
        entity="enrollments"
        uploadSlot={importBranch.slot}
        uploadDisabled={importBranch.branchId == null}
        onPreview={(input) =>
          importPreview.mutateAsync({
            ...input,
            branchId: importBranch.branchId,
          })
        }
        onCommit={(rows) =>
          importCommit.mutateAsync({ rows, branchId: importBranch.branchId })
        }
        onImported={() =>
          queryClient.invalidateQueries({
            queryKey: trpc.enrollments.pathKey(),
          })
        }
      />

      <EnrollmentFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EnrollmentStatusDialog
        open={rowAction?.variant === "status"}
        onOpenChange={(open) => {
          if (!open) closeRowAction();
        }}
        enrollment={rowAction?.variant === "status" ? rowAction.row : null}
        onUpdated={closeRowAction}
      />
      <EnrollmentDeleteDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={(open) => {
          if (!open) closeRowAction();
        }}
        enrollment={rowAction?.variant === "delete" ? rowAction.row : null}
        onDeleted={closeRowAction}
      />
    </div>
  );
}
