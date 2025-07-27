"use client";

import { type Level } from "@/server/db/schema";
import type { DataTableRowAction } from "@/features/data-table/types/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarIcon,
  Ellipsis,
  Text,
  User2Icon,
} from "lucide-react";
import * as React from "react";

import { DataTableColumnHeader } from "@/features/data-table/components/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/features/data-table/lib/format";
import { useTranslation } from "@/i18n/useTranslation";
import { Small } from "@/components/ui/typography";
import Link from "next/link";

interface UseLevelsColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<Level> | null>
  >;
}

export function useLevelsColumns({
  setRowAction,
}: UseLevelsColumnsProps): ColumnDef<Level>[] {
  const { t, locale } = useTranslation();

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t("common.selectAll")}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t("common.selectRow")}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 10,
    },
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("content.levels.name")} />
      ),
      cell: ({ cell }) => <Link href={`/content-management/${cell.row.original.courseId}/${cell.row.original.id}`} className="in-table-link">{cell.getValue<string>()}</Link>,
      meta: {
        label: t("content.levels.name"),
        placeholder: t("content.levels.searchPlaceholder"),
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
    },
    {
      id: "createdBy",
      accessorKey: "createdBy",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("content.levels.createdBy")} />
      ),
      meta: {
        label: t("content.levels.createdBy"),
        placeholder: t("content.levels.createdByPlaceholder"),
        variant: "text",
        icon: User2Icon,
      },
      enableColumnFilter: true,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("content.levels.createdAt")} />
      ),
      cell: ({ cell }) => formatDate(cell.getValue<Date>(), locale),
      meta: {
        label: t("content.levels.createdAt"),
        variant: "dateRange",
        icon: CalendarIcon,
      },
      enableColumnFilter: true,
    },
    {
      id: "actions",
      cell: function Cell({ row }) {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={t("common.openMenu")}
                variant="ghost"
                className="flex size-8 p-0 data-[state=open]:bg-muted"
              >
                <Ellipsis className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, variant: "update" })}
              >
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, variant: "delete" })}
              >
                {t("common.delete")}
                <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 10,
    },
  ];
}
