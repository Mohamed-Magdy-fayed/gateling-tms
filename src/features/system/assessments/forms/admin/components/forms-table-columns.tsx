"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Tag } from "@/components/ui/tag";
import type { Form, FormStatus } from "@/drizzle/schema";
import {
  createEntityActionsColumn,
  DataTableColumnHeader,
} from "@/features/core/data-table";
import type { useTranslation } from "@/features/core/i18n/client";
import { FormRowActions, type SetFormRowAction } from "./form-row-actions";

type Translate = ReturnType<typeof useTranslation>["t"];

const STATUS_COLOR: Record<FormStatus, "neutral" | "green" | "orange"> = {
  draft: "neutral",
  published: "green",
  archived: "orange",
};

export function buildFormColumns(opts: {
  locale: string;
  setRowAction: SetFormRowAction;
  t: Translate;
}): ColumnDef<Form>[] {
  const { locale, setRowAction, t } = opts;
  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("assessments.formTitle")}
        />
      ),
      meta: { label: t("assessments.formTitle") },
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("assessments.type")} />
      ),
      meta: { label: t("assessments.type") },
      cell: ({ row }) => (
        <Tag color="violet">
          {t(`assessments.typeOptions.${row.original.type}`)}
        </Tag>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("assessments.status")}
        />
      ),
      meta: { label: t("assessments.status") },
      cell: ({ row }) => (
        <Tag color={STATUS_COLOR[row.original.status]}>
          {t(`assessments.statusOptions.${row.original.status}`)}
        </Tag>
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
        <FormRowActions row={row.original} setRowAction={setRowAction} />
      ),
    }),
  ];
}
