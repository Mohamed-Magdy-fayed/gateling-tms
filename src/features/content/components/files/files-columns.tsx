"use client";

import { type File } from "@/server/db/schema";
import type { DataTableRowAction } from "@/features/data-table/types/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarIcon,
  Ellipsis,
  Text,
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
import Link from "next/link";

interface UseFilesColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<File> | null>
  >;
}

export function useFilesColumns({
  setRowAction,
}: UseFilesColumnsProps): ColumnDef<File>[] {
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
      id: "fileName",
      accessorKey: "fileName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("content.files.fileName")} />
      ),
      cell: ({ cell }) => <Link href={`/content-management/${cell.row.original.id}`} className="in-table-link">{cell.getValue<string>()}</Link>,
      meta: {
        label: t("content.files.fileName"),
        placeholder: t("content.files.searchPlaceholder"),
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("content.files.createdAt")} />
      ),
      cell: ({ cell }) => formatDate(cell.getValue<Date>(), locale),
      meta: {
        label: t("content.files.createdAt"),
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
