"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  createEntityActionsColumn,
  DataTableColumnHeader,
  dateRangeFilterFn,
  facetedFilterFn,
} from "@/features/core/data-table";
import type { useTranslation } from "@/features/core/i18n/client";
import type { OrganizationMemberRow } from "@/features/core/organizations/server/queries";
import {
  MemberRowActions,
  type SetMemberRowAction,
} from "./member-row-actions";

type Translate = ReturnType<typeof useTranslation>["t"];

export function buildMemberColumns(opts: {
  locale: string;
  canManage: boolean;
  setRemoveTarget: SetMemberRowAction;
  /** Set only when the academy has more than one branch. */
  setBranchesTarget?: SetMemberRowAction;
  /** branchId → name; the Branches column shows only when given. */
  branchNames?: Map<string, string>;
  t: Translate;
}): ColumnDef<OrganizationMemberRow>[] {
  const {
    locale,
    canManage,
    setRemoveTarget,
    setBranchesTarget,
    branchNames,
    t,
  } = opts;
  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
  });

  const columns: ColumnDef<OrganizationMemberRow>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("organizations.members.columnName")}
        />
      ),
      meta: { label: t("organizations.members.columnName") },
      cell: ({ row }) => row.original.name ?? row.original.email ?? "—",
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("organizations.members.columnEmail")}
        />
      ),
      meta: { label: t("organizations.members.columnEmail") },
      cell: ({ row }) => row.original.email ?? "—",
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("organizations.members.columnRole")}
        />
      ),
      meta: { label: t("organizations.members.columnRole") },
      filterFn: facetedFilterFn,
      cell: ({ row }) => (
        <Badge
          variant={row.original.role === "admin" ? "default" : "secondary"}
        >
          {t(`organizations.members.role.${row.original.role}`)}
        </Badge>
      ),
    },
    {
      accessorKey: "joinedAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("organizations.members.columnJoinedAt")}
        />
      ),
      meta: { label: t("organizations.members.columnJoinedAt") },
      filterFn: dateRangeFilterFn,
      cell: ({ row }) => dateFmt.format(new Date(row.original.joinedAt)),
    },
  ];

  if (branchNames) {
    columns.push({
      id: "branches",
      accessorFn: (row) => memberBranchLabel(row, branchNames, t, locale),
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("organizations.members.columnBranches")}
        />
      ),
      meta: { label: t("organizations.members.columnBranches") },
    });
  }

  if (canManage) {
    columns.push(
      createEntityActionsColumn({
        t,
        cell: ({ row }) => (
          <MemberRowActions
            row={row.original}
            setRemoveTarget={setRemoveTarget}
            setBranchesTarget={setBranchesTarget}
          />
        ),
      }),
    );
  }

  return columns;
}

const LIST_SEPARATOR = { en: ", ", ar: "، " } as const;

/** Admins and unassigned members work in every branch (resolveBranchAccess). */
function memberBranchLabel(
  row: OrganizationMemberRow,
  branchNames: Map<string, string>,
  t: Translate,
  locale: string,
): string {
  if (row.role === "admin" || row.branchIds.length === 0) {
    return t("organizations.members.allBranches");
  }
  return row.branchIds
    .map((id) => branchNames.get(id))
    .filter((name): name is string => Boolean(name))
    .join(LIST_SEPARATOR[locale === "ar" ? "ar" : "en"]);
}
