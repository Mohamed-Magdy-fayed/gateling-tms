"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  ColumnPinningState,
  RowSelectionState,
  VisibilityState,
} from "@tanstack/react-table";
import { MailPlusIcon, PencilIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import {
  DataTable,
  type DataTableControlledState,
  DataTablePagination,
  DataTableToolbar,
  DataTableViewOptions,
  EntityPageHeader,
  getEntityColumnPinning,
  useDataTable,
  useTableUrlState,
} from "@/features/core/data-table";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import type { OrganizationMemberRow } from "../server/queries";
import {
  InviteMemberDialog,
  MemberRemoveDialog,
  OrganizationProfileFormDialog,
  OrganizationSwitcher,
} from "./components";
import { buildMemberColumns } from "./components/members-table-columns";

export function OrganizationsSettingsPage() {
  const trpc = useTRPC();
  const { t, locale } = useTranslation();

  const { data: activeOrganization } = useQuery(
    trpc.organizations.getActive.queryOptions(),
  );

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
  const [removeTarget, setRemoveTarget] =
    useState<OrganizationMemberRow | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const listInput = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      perPage: pagination.pageSize,
      sorting,
      globalFilter: globalFilter || undefined,
    }),
    [globalFilter, pagination.pageIndex, pagination.pageSize, sorting],
  );

  const membersQuery = useQuery(
    trpc.organizations.members.list.queryOptions(listInput),
  );

  const canManage = activeOrganization?.role === "admin";

  const columns = useMemo(
    () => buildMemberColumns({ locale, canManage, setRemoveTarget, t }),
    [locale, canManage, t],
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
    data: membersQuery.data?.rows ?? [],
    pageCount: membersQuery.data?.pageCount ?? 1,
    rowCount: membersQuery.data?.total ?? 0,
    columns,
    getRowId: (row) => row.userId,
    controlled,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <EntityPageHeader
          title={t("organizations.pageTitle")}
          lead={t("organizations.pageLead")}
        />
        <OrganizationSwitcher
          activeOrganizationId={activeOrganization?.id ?? null}
        />
      </div>

      {activeOrganization ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">
                {activeOrganization.name}
              </CardTitle>
              <Tag color="violet">
                {t(`organizations.plan.${activeOrganization.plan}`)}
              </Tag>
            </div>
            {activeOrganization.businessName ? (
              <CardDescription>
                {activeOrganization.businessName}
              </CardDescription>
            ) : null}
            {canManage ? (
              <CardAction>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditProfileOpen(true)}
                >
                  <PencilIcon className="size-3.5" />
                  {t("actions.edit")}
                </Button>
              </CardAction>
            ) : null}
          </CardHeader>
        </Card>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">
            {t("organizations.members.title")}
          </h2>
        </div>

        <DataTable
          table={table}
          toolbar={
            <DataTableToolbar
              table={table}
              globalFilter={resolvedGlobalFilter}
              onGlobalFilterChange={(value) => setResolvedGlobalFilter(value)}
              searchPlaceholder={t("organizations.members.searchHint")}
            >
              {canManage ? (
                <Button
                  type="button"
                  size="icon"
                  className="size-8"
                  onClick={() => setInviteOpen(true)}
                  aria-label={t("organizations.members.inviteButton")}
                >
                  <MailPlusIcon className="size-3.5" />
                </Button>
              ) : null}
              <DataTableViewOptions table={table} />
            </DataTableToolbar>
          }
          footer={<DataTablePagination table={table} />}
        />
      </div>

      {activeOrganization ? (
        <OrganizationProfileFormDialog
          open={editProfileOpen}
          onOpenChange={setEditProfileOpen}
          organization={activeOrganization}
        />
      ) : null}
      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <MemberRemoveDialog
        open={removeTarget != null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        member={removeTarget}
      />
    </div>
  );
}
