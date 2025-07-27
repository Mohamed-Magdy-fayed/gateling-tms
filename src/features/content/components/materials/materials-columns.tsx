"use client";

import { type Material } from "@/server/db/schema";
import type { Option } from "@/features/data-table/types/data-table";
import type { ColumnDef, Row } from "@tanstack/react-table";
import {
  CalendarIcon,
  Ellipsis,
  HashIcon,
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
import Link from "next/link";

export interface MaterialsRowAction<TData> {
  row: Row<TData>;
  variant: "update" | "delete" | "files";
}

interface UseMaterialsColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<MaterialsRowAction<Material> | null>
  >;
  options: Option[];
}

export function useMaterialsColumns({
  setRowAction,
  options,
}: UseMaterialsColumnsProps): ColumnDef<Material>[] {
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
      id: "title",
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("content.materials.title")} />
      ),
      cell: ({ cell }) => <Link href={`/content-management/materials/${cell.row.original.id}`} className="in-table-link">{cell.getValue<string>()}</Link>,
      meta: {
        label: t("content.materials.title"),
        placeholder: t("content.materials.titleSearchPlaceholder"),
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
    },
    {
      id: "createdBy",
      accessorKey: "createdBy",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("content.materials.createdBy")} />
      ),
      meta: {
        label: t("content.materials.createdBy"),
        placeholder: t("content.materials.createdByPlaceholder"),
        variant: "text",
        icon: User2Icon,
      },
      enableColumnFilter: true,
    },
    {
      id: "levelIds",
      accessorKey: "levelIds",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("content.materials.levelIds")} />
      ),
      cell: ({ row }) => row.original.levelName ?? "",
      meta: {
        label: t("content.materials.levelIds"),
        variant: "multiSelect",
        options,
        icon: User2Icon,
      },
      enableColumnFilter: true,
    },
    {
      id: "order",
      accessorKey: "order",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("content.materials.order")} />
      ),
      cell: ({ cell }) => cell.getValue<string>(),
      meta: {
        label: t("content.materials.order"),
        placeholder: t("content.materials.orderSearchPlaceholder"),
        variant: "range",
        range: [0, 30],
        icon: HashIcon,
      },
      enableColumnFilter: true,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("content.materials.createdAt")} />
      ),
      cell: ({ cell }) => formatDate(cell.getValue<Date>(), locale),
      meta: {
        label: t("content.materials.createdAt"),
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
                onSelect={() => setRowAction({ row, variant: "files" })}
              >
                {t("content.fileSheet.createTitle")}
              </DropdownMenuItem>
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
