"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Course } from "@/drizzle/schema";
import {
  createEntityActionsColumn,
  DataTableColumnHeader,
} from "@/features/core/data-table";
import type { useTranslation } from "@/features/core/i18n/client";
import {
  CourseRowActions,
  type SetCourseRowAction,
} from "./course-row-actions";

type Translate = ReturnType<typeof useTranslation>["t"];

export function buildCourseColumns(opts: {
  locale: string;
  setRowAction: SetCourseRowAction;
  t: Translate;
}): ColumnDef<Course>[] {
  const { locale, setRowAction, t } = opts;
  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("courses.name")} />
      ),
      meta: { label: t("courses.name") },
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("courses.description")}
        />
      ),
      meta: { label: t("courses.description") },
      cell: ({ row }) => row.original.description ?? "—",
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
        <CourseRowActions row={row.original} setRowAction={setRowAction} />
      ),
    }),
  ];
}
