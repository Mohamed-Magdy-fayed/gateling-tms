"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import {
  createEntityActionsColumn,
  DataTableColumnHeader,
} from "@/features/core/data-table";
import type { useTranslation } from "@/features/core/i18n/client";
import {
  CertificateRowActions,
  type SetCertificateRowAction,
} from "./certificate-row-actions";

type Translate = ReturnType<typeof useTranslation>["t"];

/** The projection `certificates.list` returns — not the raw table row. */
export type CertificateListRow = {
  id: string;
  traineeId: string;
  traineeName: string;
  title: string;
  courseName: string | null;
  groupName: string | null;
  issuedAt: Date;
};

/**
 * Shared with the CSV export so a row exports the same string it displays —
 * a raw `Date` would stringify in the host's zone and locale instead.
 *
 * Explicit time zone: without one the server formats in the host's zone and
 * the browser in the viewer's, which hydrates mismatched (STATE.md D80's org
 * clock is the one the academy actually works on).
 */
export function createCertificateDateFormat(opts: {
  locale: string;
  timeZone: string;
}): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(opts.locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
    timeZone: opts.timeZone,
  });
}

export function buildCertificateColumns(opts: {
  locale: string;
  setRowAction: SetCertificateRowAction;
  t: Translate;
  timeZone: string;
}): ColumnDef<CertificateListRow>[] {
  const { locale, setRowAction, t, timeZone } = opts;
  const dateFmt = createCertificateDateFormat({ locale, timeZone });

  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("certificates.certificateTitle")}
        />
      ),
      meta: { label: t("certificates.certificateTitle") },
      cell: ({ row }) => (
        <Link
          href={`/certificates/${row.original.id}`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {row.original.title}
        </Link>
      ),
    },
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
          className="underline-offset-4 hover:underline"
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
          title={t("certificates.course")}
        />
      ),
      meta: { label: t("certificates.course") },
      // Both are nulled outright when the referenced row is deleted (D79), so
      // an em dash is the normal reading of an old certificate, not an error.
      cell: ({ row }) => row.original.courseName ?? "—",
      enableSorting: false,
    },
    {
      accessorKey: "groupName",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("certificates.group")}
        />
      ),
      meta: { label: t("certificates.group") },
      cell: ({ row }) => row.original.groupName ?? "—",
      enableSorting: false,
    },
    {
      accessorKey: "issuedAt",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("certificates.issuedAt")}
        />
      ),
      meta: { label: t("certificates.issuedAt") },
      cell: ({ row }) => dateFmt.format(row.original.issuedAt),
    },
    createEntityActionsColumn({
      t,
      cell: ({ row }) => (
        <CertificateRowActions row={row.original} setRowAction={setRowAction} />
      ),
    }),
  ];
}
