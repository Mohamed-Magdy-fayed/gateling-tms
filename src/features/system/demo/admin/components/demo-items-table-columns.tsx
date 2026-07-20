"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { DemoItem } from "@/drizzle/schema";
import {
  createEntityActionsColumn,
  DataTableColumnHeader,
} from "@/features/core/data-table";
import type { useTranslation } from "@/features/core/i18n/client";
import {
  DemoItemRowActions,
  type SetDemoItemRowAction,
} from "./demo-item-row-actions";

type Translate = ReturnType<typeof useTranslation>["t"];

export function buildDemoItemColumns(opts: {
  locale: string;
  setRowAction: SetDemoItemRowAction;
  t: Translate;
}): ColumnDef<DemoItem>[] {
  const { locale, setRowAction, t } = opts;
  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("systemPages.demoItemName")}
        />
      ),
      meta: { label: t("systemPages.demoItemName") },
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("systemPages.demoItemActive")}
        />
      ),
      meta: { label: t("systemPages.demoItemActive") },
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? t("common.yes") : t("common.no")}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("common.createdAt")} />
      ),
      meta: { label: t("common.createdAt") },
      cell: ({ row }) => dateFmt.format(new Date(row.original.createdAt)),
    },
    createEntityActionsColumn({
      t,
      cell: ({ row }) => (
        <DemoItemRowActions row={row.original} setRowAction={setRowAction} />
      ),
    }),
  ];
}
