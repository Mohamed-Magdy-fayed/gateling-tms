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
import { AlertTriangleIcon, Building2Icon, RotateCwIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { H3, Muted } from "@/components/ui/typography";
import {
  DataTable,
  type DataTableControlledState,
  DataTablePagination,
  DataTableToolbar,
  useDataTable,
  useTableUrlState,
} from "@/features/core/data-table";
import { useTranslation } from "@/features/core/i18n/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTRPC } from "@/integrations/trpc/client";
import {
  buildAcademyColumns,
  type PlanChangeRequest,
} from "./academies-table-columns";
import { PlanChangeDialog } from "./plan-change-dialog";

/**
 * The platform owner's list of every academy, with a plan select per row
 * (design 9A). Picking a plan opens a confirm naming the change (6A); the
 * grant goes through `platform.setOrganizationPlan`, which re-checks the
 * owner flag server-side.
 */
export function AcademiesSection() {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const compact = useIsMobile();

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
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({});
  const [request, setRequest] = useState<PlanChangeRequest | null>(null);

  const listInput = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      perPage: pagination.pageSize,
      globalFilter: globalFilter || undefined,
    }),
    [globalFilter, pagination.pageIndex, pagination.pageSize],
  );
  const listQuery = useQuery({
    ...trpc.platform.listOrganizations.queryOptions(listInput),
    placeholderData: keepPreviousData,
  });

  const setPlanMut = useMutation(
    trpc.platform.setOrganizationPlan.mutationOptions(),
  );
  const pendingOrganizationId = setPlanMut.isPending
    ? (setPlanMut.variables?.organizationId ?? null)
    : null;

  async function handleConfirm(change: PlanChangeRequest) {
    try {
      await setPlanMut.mutateAsync({
        organizationId: change.organization.id,
        plan: change.plan,
      });
      // The owner's own academy may be the one that changed: its plan tag and
      // usage meters read these two queries.
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: trpc.platform.listOrganizations.pathKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: trpc.organizations.getActive.pathKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: trpc.organizations.usage.pathKey(),
        }),
      ]);
      toast.success(t("settings.academies.updated"));
      setRequest(null);
    } catch {
      toast.error(t("settings.academies.updateFailed"));
    }
  }

  const columns = useMemo(
    () =>
      buildAcademyColumns({
        t,
        locale,
        compact,
        pendingOrganizationId,
        onRequestPlanChange: setRequest,
      }),
    [t, locale, compact, pendingOrganizationId],
  );

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

  const {
    table,
    globalFilter: resolvedGlobalFilter,
    setGlobalFilter: setResolvedGlobalFilter,
  } = useDataTable({
    mode: "server",
    data: listQuery.data?.rows ?? [],
    pageCount: listQuery.data?.pageCount ?? 1,
    rowCount: listQuery.data?.total ?? 0,
    columns,
    getRowId: (row) => row.id,
    controlled,
  });

  const isEmpty = listQuery.data?.total === 0 && !globalFilter;

  return (
    <section aria-labelledby="platform-academies" className="space-y-3">
      <div className="space-y-1">
        <H3 id="platform-academies" className="text-lg">
          {t("settings.academies.title")}
        </H3>
        <Muted>{t("settings.academies.description")}</Muted>
      </div>

      {listQuery.isError ? (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {t("settings.academies.loadFailed")}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void listQuery.refetch()}
            >
              <RotateCwIcon className="size-3.5" />
              {t("settings.academies.retry")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : !listQuery.data ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={<Building2Icon />}
          title={t("settings.academies.empty")}
        />
      ) : (
        <DataTable
          table={table}
          toolbar={
            <DataTableToolbar
              table={table}
              globalFilter={resolvedGlobalFilter}
              onGlobalFilterChange={(value) => setResolvedGlobalFilter(value)}
              searchPlaceholder={t("settings.academies.searchHint")}
            />
          }
          footer={<DataTablePagination table={table} />}
        />
      )}

      <PlanChangeDialog
        request={request}
        pending={setPlanMut.isPending}
        onConfirm={(change) => void handleConfirm(change)}
        onOpenChange={(open) => {
          if (!open && !setPlanMut.isPending) setRequest(null);
        }}
      />
    </section>
  );
}
