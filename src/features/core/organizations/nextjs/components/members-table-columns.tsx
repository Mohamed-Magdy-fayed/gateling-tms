"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  createEntityActionsColumn,
  DataTableColumnHeader,
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
  t: Translate;
}): ColumnDef<OrganizationMemberRow>[] {
  const { locale, canManage, setRemoveTarget, t } = opts;
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
      cell: ({ row }) => (
        <Badge variant={row.original.role === "admin" ? "default" : "secondary"}>
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
      cell: ({ row }) => dateFmt.format(new Date(row.original.joinedAt)),
    },
  ];

  if (canManage) {
    columns.push(
      createEntityActionsColumn({
        t,
        cell: ({ row }) => (
          <MemberRowActions row={row.original} setRemoveTarget={setRemoveTarget} />
        ),
      }),
    );
  }

  return columns;
}
