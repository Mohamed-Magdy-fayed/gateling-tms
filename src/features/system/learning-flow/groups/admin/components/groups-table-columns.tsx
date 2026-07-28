"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import type { GroupScheduleSlot, GroupStatus } from "@/drizzle/schema";
import {
  createEntityActionsColumn,
  DataTableColumnHeader,
} from "@/features/core/data-table";
import type { useTranslation } from "@/features/core/i18n/client";
import { GroupRowActions, type SetGroupRowAction } from "./group-row-actions";
import { GroupStatusTag } from "./group-status-tag";

type Translate = ReturnType<typeof useTranslation>["t"];

/** The projection `groups.list` returns — not the raw table row. */
export type GroupListRow = {
  id: string;
  name: string;
  courseId: string | null;
  courseName: string | null;
  teacherId: string | null;
  teacherName: string | null;
  schedule: GroupScheduleSlot[];
  startDate: string;
  sessionCount: number;
  status: GroupStatus;
  createdAt: Date;
};

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

/** "Monday and Wednesday" — days alone; the table has no room for times. */
function formatScheduleDays(
  schedule: GroupScheduleSlot[],
  locale: string,
  t: Translate,
): string {
  const days = [...new Set(schedule.map((slot) => slot.day))]
    .filter((day) => day >= 0 && day <= 6)
    .sort((a, b) => a - b)
    .map((day) => t(`groups.days.${DAY_KEYS[day]}`));

  if (days.length === 0) return "—";

  return new Intl.ListFormat(locale === "ar" ? "ar" : "en", {
    style: "short",
    type: "conjunction",
  }).format(days);
}

export function buildGroupColumns(opts: {
  locale: string;
  setRowAction: SetGroupRowAction;
  t: Translate;
}): ColumnDef<GroupListRow>[] {
  const { locale, setRowAction, t } = opts;
  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
  });

  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("groups.name")} />
      ),
      meta: { label: t("groups.name") },
      cell: ({ row }) => (
        <Link
          href={`/learning-flow/groups/${row.original.id}`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "courseName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("groups.course")} />
      ),
      meta: { label: t("groups.course") },
      enableSorting: false,
      cell: ({ row }) => row.original.courseName ?? t("groups.noCourse"),
    },
    {
      accessorKey: "teacherName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("groups.teacher")} />
      ),
      meta: { label: t("groups.teacher") },
      enableSorting: false,
      cell: ({ row }) => row.original.teacherName ?? t("groups.noTeacher"),
    },
    {
      id: "schedule",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("groups.schedule")} />
      ),
      meta: { label: t("groups.schedule") },
      enableSorting: false,
      cell: ({ row }) => formatScheduleDays(row.original.schedule, locale, t),
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("groups.startDate")} />
      ),
      meta: { label: t("groups.startDate") },
      // `startDate` is a plain calendar date; parsing it as UTC keeps it from
      // shifting a day for anyone west of Greenwich.
      cell: ({ row }) =>
        dateFmt.format(new Date(`${row.original.startDate}T00:00:00Z`)),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("groups.status")} />
      ),
      meta: { label: t("groups.status") },
      enableSorting: false,
      cell: ({ row }) => <GroupStatusTag status={row.original.status} />,
    },
    createEntityActionsColumn({
      t,
      cell: ({ row }) => (
        <GroupRowActions row={row.original} setRowAction={setRowAction} />
      ),
    }),
  ];
}
