"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type {
  ColumnPinningState,
  RowSelectionState,
  VisibilityState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
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
  selectedFilterValues,
  useDataTable,
  useTableUrlState,
} from "@/features/core/data-table";
import { useTranslation } from "@/features/core/i18n/client";
import {
  BRANCH_COLUMN_ID,
  useBranchListColumn,
} from "@/features/core/organizations/nextjs";
import { useTRPC } from "@/integrations/trpc/client";
import {
  buildCertificateColumns,
  type CertificateListRow,
  CertificateRevokeDialog,
  type CertificateRowActionVariant,
  createCertificateDateFormat,
} from "./components";

type RowAction = {
  row: CertificateListRow;
  variant: CertificateRowActionVariant;
} | null;

// Read-and-revoke only: issuing happens on a trainee's own page, where the
// completed enrollment that justifies the certificate is in front of the user.
export function CertificatesTablePage() {
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

  const { data: organization } = useQuery(
    trpc.organizations.getActive.queryOptions(),
  );
  const timeZone = organization?.timeZone ?? "UTC";

  const baseColumns = useMemo(
    () => buildCertificateColumns({ locale, setRowAction, t, timeZone }),
    [locale, t, timeZone],
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
      // The course and group filters hold ids even though their columns show
      // names — the server filters on the id columns.
      courseIds: selectedFilterValues(columnFilters, "courseName"),
      groupIds: selectedFilterValues(columnFilters, "groupName"),
      issuedAt: dateRangeFilterBounds(columnFilters, "issuedAt"),
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
  const { data: groups } = useQuery(
    trpc.groups.list.queryOptions({ page: 1, perPage: 100, sorting: [] }),
  );
  const courseOptions = useMemo(
    () =>
      (courses?.rows ?? []).map((course) => ({
        value: course.id,
        label: course.name,
      })),
    [courses],
  );
  const groupOptions = useMemo(
    () =>
      (groups?.rows ?? []).map((group) => ({
        value: group.id,
        label: group.name,
      })),
    [groups],
  );

  const { data, isFetching } = useQuery({
    ...trpc.certificates.list.queryOptions(listInput),
    placeholderData: keepPreviousData,
  });

  // The server clamps an out-of-range requested page (e.g. after the last row
  // on it was revoked) — sync local state to whatever it actually served.
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

  const dateFmt = useMemo(
    () => createCertificateDateFormat({ locale, timeZone }),
    [locale, timeZone],
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
      <EntityPageHeader
        title={t("certificates.title")}
        lead={t("certificates.lead")}
      />

      <DataTable
        table={table}
        toolbar={
          <DataTableToolbar
            table={table}
            globalFilter={resolvedGlobalFilter}
            onGlobalFilterChange={(value) => setResolvedGlobalFilter(value)}
            searchPlaceholder={t("certificates.searchHint")}
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
                  column={table.getColumn("courseName")}
                  title={t("certificates.course")}
                  options={courseOptions}
                />
                <DataTableFacetedFilter
                  column={table.getColumn("groupName")}
                  title={t("certificates.group")}
                  options={groupOptions}
                />
                <DataTableDateRangeFilter
                  column={table.getColumn("issuedAt")}
                  title={t("certificates.issuedAt")}
                />
              </>
            }
          >
            <DataTableExportButton
              table={table}
              // `issuedAt` is a Date; left raw it would stringify in the
              // host's zone, so the CSV and the column would disagree.
              getExportRow={(row) => ({
                ...row,
                issuedAt: dateFmt.format(row.issuedAt),
              })}
              exportFileName="certificates.csv"
            />
            <DataTableViewOptions table={table} />
          </DataTableToolbar>
        }
        footer={<DataTablePagination table={table} />}
      />

      <CertificateRevokeDialog
        open={rowAction?.variant === "revoke"}
        onOpenChange={(open) => {
          if (!open) closeRowAction();
        }}
        certificate={rowAction?.variant === "revoke" ? rowAction.row : null}
        onRevoked={closeRowAction}
      />
    </div>
  );
}
