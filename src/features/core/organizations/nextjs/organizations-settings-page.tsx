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
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Tag } from "@/components/ui/tag";
import { H3 } from "@/components/ui/typography";
import { organizationMembershipRoleValues } from "@/drizzle/schema";
import {
  DataTable,
  type DataTableControlledState,
  DataTableDateRangeFilter,
  DataTableFacetedFilter,
  DataTablePagination,
  DataTableToolbar,
  DataTableViewOptions,
  EntityPageHeader,
  getEntityColumnPinning,
  useDataTable,
  useTableUrlState,
} from "@/features/core/data-table";
import { useTranslation } from "@/features/core/i18n/client";
import { PublicShowcaseCard } from "@/features/marketing/testimonials/admin";
import { AcademyPreferencesSection } from "@/features/system/settings/admin";
import { useTRPC } from "@/integrations/trpc/client";
import type { OrganizationMemberRow } from "../server/queries";
import {
  BranchesSection,
  InviteMemberDialog,
  MemberBranchesDialog,
  MemberRemoveDialog,
  OrganizationProfileFormDialog,
  PlanUsageCard,
} from "./components";
import { buildMemberColumns } from "./components/members-table-columns";

/**
 * Staff run the academy; students only hold portal accounts. They're listed
 * apart so a large academy's students don't bury its teachers, while a
 * student's portal access can still be found and removed here.
 */
type MemberAudience = "staff" | "students";

const isInAudience = (row: OrganizationMemberRow, audience: MemberAudience) =>
  audience === "students" ? row.role === "student" : row.role !== "student";

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
  const [branchesTarget, setBranchesTarget] =
    useState<OrganizationMemberRow | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [audience, setAudience] = useState<MemberAudience>("staff");

  // Students are one role, so only the staff view has a role filter.
  const roleOptions = useMemo(
    () =>
      organizationMembershipRoleValues
        .filter((role) => role !== "student")
        .map((role) => ({
          value: role,
          label: t(`organizations.members.role.${role}`),
        })),
    [t],
  );

  // A definition list: loaded whole and sorted/filtered in the browser. The
  // server already narrows it to the selected branches.
  const membersQuery = useQuery(
    trpc.organizations.members.listAll.queryOptions(),
  );
  const members = useMemo(
    () =>
      (membersQuery.data ?? []).filter((row) => isInAudience(row, audience)),
    [membersQuery.data, audience],
  );

  function handleAudienceChange(value: string) {
    if (value !== "staff" && value !== "students") return;
    setAudience(value);
    // A role filter from the staff view would empty the students view.
    setColumnFilters((prev) => prev.filter((filter) => filter.id !== "role"));
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }

  const canManage = activeOrganization?.role === "admin";

  const branchesQuery = useQuery(
    trpc.organizations.branches.list.queryOptions(),
  );
  const branches = useMemo(
    () => branchesQuery.data ?? [],
    [branchesQuery.data],
  );
  // A single-branch academy looks exactly as it did before branches existed.
  const hasBranches = branches.length > 1;
  const branchNames = useMemo(
    () =>
      hasBranches
        ? new Map(branches.map((branch) => [branch.id, branch.name]))
        : undefined,
    [branches, hasBranches],
  );

  const columns = useMemo(
    () =>
      buildMemberColumns({
        locale,
        canManage,
        setRemoveTarget,
        setBranchesTarget: hasBranches ? setBranchesTarget : undefined,
        branchNames,
        t,
      }),
    [locale, canManage, hasBranches, branchNames, t],
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
    mode: "client",
    data: members,
    columns,
    getRowId: (row) => row.userId,
    controlled,
  });

  return (
    <div className="space-y-6">
      {/* The academy switcher lives in the sidebar header, on every page. */}
      <EntityPageHeader
        title={t("organizations.pageTitle")}
        lead={t("organizations.pageLead")}
      />

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
                  <PencilIcon className="size-3.5" aria-hidden />
                  {t("actions.edit")}
                </Button>
              </CardAction>
            ) : null}
          </CardHeader>
        </Card>
      ) : null}

      <PlanUsageCard />

      {/* Admin-only: branches.create/update are orgAdminProcedure. */}
      {canManage ? <BranchesSection /> : null}

      {/* Admin-only: settings.academy.* is orgAdminProcedure (design 1A). */}
      {canManage ? <AcademyPreferencesSection /> : null}

      {/* Admin-only: `testimonials.status` is orgAdminProcedure, and speaking
          publicly for the academy is the owner's call, not any member's. */}
      {canManage ? <PublicShowcaseCard /> : null}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <H3 className="text-lg">{t("organizations.members.title")}</H3>
          <SegmentedControl
            size="sm"
            aria-label={t("organizations.members.audience.label")}
            value={audience}
            onValueChange={handleAudienceChange}
            options={[
              {
                value: "staff",
                label: t("organizations.members.audience.staff"),
              },
              {
                value: "students",
                label: t("organizations.members.audience.students"),
              },
            ]}
          />
        </div>

        <DataTable
          table={table}
          toolbar={
            <DataTableToolbar
              table={table}
              globalFilter={resolvedGlobalFilter}
              onGlobalFilterChange={(value) => setResolvedGlobalFilter(value)}
              searchPlaceholder={t("organizations.members.searchHint")}
              filterSlot={
                <>
                  {audience === "staff" ? (
                    <DataTableFacetedFilter
                      column={table.getColumn("role")}
                      title={t("organizations.members.columnRole")}
                      options={roleOptions}
                    />
                  ) : null}
                  <DataTableDateRangeFilter
                    column={table.getColumn("joinedAt")}
                    title={t("organizations.members.columnJoinedAt")}
                  />
                </>
              }
            >
              {canManage ? (
                <Button
                  type="button"
                  size="icon"
                  className="size-8"
                  onClick={() => setInviteOpen(true)}
                  aria-label={t("organizations.members.inviteButton")}
                >
                  <MailPlusIcon className="size-3.5" aria-hidden />
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
      <MemberBranchesDialog
        key={branchesTarget?.userId ?? "none"}
        member={branchesTarget}
        branches={branches}
        onOpenChange={(open) => {
          if (!open) setBranchesTarget(null);
        }}
      />
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
