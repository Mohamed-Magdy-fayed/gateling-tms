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
import { groupStatusValues } from "@/drizzle/schema";
import {
  DataTable,
  type DataTableControlledState,
  DataTableExportButton,
  DataTableFacetedFilter,
  DataTablePagination,
  DataTableToolbar,
  DataTableViewOptions,
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
import { useTRPC } from "@/integrations/trpc/client";

import {
  buildGroupColumns,
  GroupDeleteDialog,
  GroupFormDialog,
  type GroupListRow,
  type GroupRowActionVariant,
} from "./components";

type RowAction = { row: GroupListRow; variant: GroupRowActionVariant } | null;

export function GroupsTablePage() {
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
    trpc.groups.importStudentsPreview.mutationOptions(),
  );
  const importCommit = useMutation(
    trpc.groups.importStudentsCommit.mutationOptions(),
  );

  const listInput = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      perPage: pagination.pageSize,
      sorting,
      globalFilter: globalFilter || undefined,
      statuses: selectedEnumFilterValues(
        columnFilters,
        "status",
        groupStatusValues,
      ),
      courseIds: selectedFilterValues(columnFilters, "courseName"),
      teacherIds: selectedFilterValues(columnFilters, "teacherName"),
    }),
    [
      columnFilters,
      globalFilter,
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
    ],
  );

  // Filter options. The course and teacher filters hold ids even though their
  // columns display names — the server filters on the id columns.
  const { data: courses } = useQuery(
    trpc.courses.list.queryOptions({ page: 1, perPage: 100, sorting: [] }),
  );
  const { data: members } = useQuery(
    trpc.organizations.members.list.queryOptions({
      page: 1,
      perPage: 100,
      sorting: [],
    }),
  );
  const statusOptions = useMemo(
    () =>
      groupStatusValues.map((status) => ({
        value: status,
        label: t(`groups.statusOptions.${status}`),
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
  const teacherOptions = useMemo(
    () =>
      (members?.rows ?? []).map((member) => ({
        value: member.userId,
        label: member.name || member.email || member.userId,
      })),
    [members],
  );

  const { data, isFetching } = useQuery({
    ...trpc.groups.list.queryOptions(listInput),
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
    () => buildGroupColumns({ locale, setRowAction, t }),
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
      <EntityPageHeader title={t("groups.title")} lead={t("groups.lead")} />

      <DataTable
        table={table}
        toolbar={
          <DataTableToolbar
            table={table}
            globalFilter={resolvedGlobalFilter}
            onGlobalFilterChange={(value) => setResolvedGlobalFilter(value)}
            searchPlaceholder={t("groups.searchHint")}
            filterSlot={
              <>
                <DataTableFacetedFilter
                  column={table.getColumn("status")}
                  title={t("groups.status")}
                  options={statusOptions}
                />
                <DataTableFacetedFilter
                  column={table.getColumn("courseName")}
                  title={t("groups.course")}
                  options={courseOptions}
                />
                <DataTableFacetedFilter
                  column={table.getColumn("teacherName")}
                  title={t("groups.teacher")}
                  options={teacherOptions}
                />
              </>
            }
          >
            <DataTableExportButton
              table={table}
              getExportRow={(row) => row}
              exportFileName="groups.csv"
            />
            <EntityExportButton
              entities={[
                {
                  entity: "group-students",
                  titleKey: "import.groupStudents.title",
                },
              ]}
            />
            {/* A roster file names one group per row, so it spans the whole
                list rather than one group's detail page. */}
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-8"
              onClick={() => setImportOpen(true)}
              aria-label={t("import.groupStudents.action")}
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
        entity="group-students"
        onPreview={(input) => importPreview.mutateAsync(input)}
        onCommit={(rows) => importCommit.mutateAsync({ rows })}
        onImported={() =>
          queryClient.invalidateQueries({ queryKey: trpc.groups.pathKey() })
        }
      />

      <GroupFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <GroupFormDialog
        open={rowAction?.variant === "edit"}
        onOpenChange={(open) => {
          if (!open) closeRowAction();
        }}
        group={rowAction?.variant === "edit" ? rowAction.row : null}
      />
      <GroupDeleteDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={(open) => {
          if (!open) closeRowAction();
        }}
        group={rowAction?.variant === "delete" ? rowAction.row : null}
        onDeleted={closeRowAction}
      />
    </div>
  );
}
