"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import { useCallback, useMemo } from "react";
import {
  DataTableColumnHeader,
  selectedFilterValues,
} from "@/features/core/data-table";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

/** Id of the Branch column — also the column filter the list input reads. */
export const BRANCH_COLUMN_ID = "branch";

/**
 * The Branch column and filter of a branch-owned list
 * (docs/designs/academy-branches.md). Shown only on "All branches", and only
 * when there is more than one branch to tell apart — a single-branch
 * academy's lists look exactly as they did before branches existed. The
 * column goes just before the row-actions column.
 */
export function useBranchListColumn<T extends { branchId: string }>(
  baseColumns: ColumnDef<T>[],
) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const { data } = useQuery(trpc.organizations.branches.scope.queryOptions());

  const show =
    data?.activeBranchId === null && (data?.branches.length ?? 0) > 1;

  const options = useMemo(
    () =>
      (data?.branches ?? []).map((branch) => ({
        value: branch.id,
        label: branch.name,
      })),
    [data],
  );

  const columns = useMemo<ColumnDef<T>[]>(() => {
    if (!show) return baseColumns;
    const names = new Map(options.map((o) => [o.value, o.label]));
    const branchColumn: ColumnDef<T> = {
      id: BRANCH_COLUMN_ID,
      accessorFn: (row) => row.branchId,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("organizations.branches.column")}
        />
      ),
      meta: { label: t("organizations.branches.column") },
      enableSorting: false,
      cell: ({ row }) => names.get(row.original.branchId) ?? "—",
    };
    return [
      ...baseColumns.slice(0, -1),
      branchColumn,
      ...baseColumns.slice(-1),
    ];
  }, [baseColumns, options, show, t]);

  // The list input's `branchIds`. Only sent while the column shows: a
  // filter left in the URL after switching to one branch must not empty the
  // list.
  const branchIdsFilter = useCallback(
    (columnFilters: ColumnFiltersState) =>
      show ? selectedFilterValues(columnFilters, BRANCH_COLUMN_ID) : undefined,
    [show],
  );

  return { columns, show, options, branchIdsFilter };
}
