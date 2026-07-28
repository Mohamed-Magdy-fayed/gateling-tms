"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import type { EnrollmentStatus } from "@/drizzle/schema";
import {
  createEntityActionsColumn,
  DataTableColumnHeader,
} from "@/features/core/data-table";
import type { useTranslation } from "@/features/core/i18n/client";
import {
  EnrollmentRowActions,
  type SetEnrollmentRowAction,
} from "./enrollment-row-actions";
import { EnrollmentStatusTag } from "./enrollment-status-tag";

type Translate = ReturnType<typeof useTranslation>["t"];

/** The projection `enrollments.list` returns — not the raw table row. */
export type EnrollmentListRow = {
  id: string;
  traineeId: string;
  traineeName: string;
  courseId: string;
  courseName: string;
  status: EnrollmentStatus;
  createdAt: Date;
};

export function buildEnrollmentColumns(opts: {
  locale: string;
  setRowAction: SetEnrollmentRowAction;
  t: Translate;
}): ColumnDef<EnrollmentListRow>[] {
  const { locale, setRowAction, t } = opts;
  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
  });

  return [
    {
      accessorKey: "traineeName",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("enrollments.trainee")}
        />
      ),
      meta: { label: t("enrollments.trainee") },
      cell: ({ row }) => (
        <Link
          href={`/learning-flow/trainees/${row.original.traineeId}`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {row.original.traineeName}
        </Link>
      ),
    },
    {
      accessorKey: "courseName",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("enrollments.course")}
        />
      ),
      meta: { label: t("enrollments.course") },
      cell: ({ row }) => (
        <Link
          href={`/content-library/courses/${row.original.courseId}`}
          className="underline-offset-4 hover:underline"
        >
          {row.original.courseName}
        </Link>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("enrollments.status")}
        />
      ),
      meta: { label: t("enrollments.status") },
      cell: ({ row }) => <EnrollmentStatusTag status={row.original.status} />,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("enrollments.enrolledAt")}
        />
      ),
      meta: { label: t("enrollments.enrolledAt") },
      cell: ({ row }) => dateFmt.format(row.original.createdAt),
    },
    createEntityActionsColumn({
      t,
      cell: ({ row }) => (
        <EnrollmentRowActions row={row.original} setRowAction={setRowAction} />
      ),
    }),
  ];
}
