"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import type { Trainee } from "@/drizzle/schema";
import {
  createEntityActionsColumn,
  DataTableColumnHeader,
} from "@/features/core/data-table";
import type { useTranslation } from "@/features/core/i18n/client";
import {
  type SetTraineeRowAction,
  TraineeRowActions,
} from "./trainee-row-actions";

type Translate = ReturnType<typeof useTranslation>["t"];

export function buildTraineeColumns(opts: {
  locale: string;
  setRowAction: SetTraineeRowAction;
  t: Translate;
}): ColumnDef<Trainee>[] {
  const { locale, setRowAction, t } = opts;
  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("trainees.name")} />
      ),
      meta: { label: t("trainees.name") },
      cell: ({ row }) => (
        <Link
          href={`/learning-flow/trainees/${row.original.id}`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("trainees.phone")} />
      ),
      meta: { label: t("trainees.phone") },
      cell: ({ row }) => row.original.phone ?? "—",
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("trainees.email")} />
      ),
      meta: { label: t("trainees.email") },
      cell: ({ row }) => row.original.email ?? "—",
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
        <TraineeRowActions row={row.original} setRowAction={setRowAction} />
      ),
    }),
  ];
}
