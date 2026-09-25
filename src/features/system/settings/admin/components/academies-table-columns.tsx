"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tag } from "@/components/ui/tag";
import {
  type OrganizationPlan,
  organizationPlanValues,
} from "@/drizzle/schema";
import { DataTableColumnHeader } from "@/features/core/data-table";
import type { useTranslation } from "@/features/core/i18n/client";
import type { PlatformOrganizationRow } from "@/features/core/organizations/server";
import { PLAN_LIMITS } from "@/features/core/organizations/server/limits";
import { cn } from "@/lib/utils";

type Translate = ReturnType<typeof useTranslation>["t"];

export type PlanChangeRequest = {
  organization: PlatformOrganizationRow;
  plan: OrganizationPlan;
};

type ColumnOptions = {
  t: Translate;
  locale: string;
  // Below `md` the email, students and granted columns are hidden and shown
  // as an expandable detail under the academy name instead (design 11A).
  compact: boolean;
  pendingOrganizationId: string | null;
  onRequestPlanChange: (request: PlanChangeRequest) => void;
};

export function buildAcademyColumns(
  opts: ColumnOptions,
): ColumnDef<PlatformOrganizationRow>[] {
  const { t, locale, compact, pendingOrganizationId, onRequestPlanChange } =
    opts;
  const dateFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
  });

  const numberFmt = new Intl.NumberFormat(locale === "ar" ? "ar" : "en");

  const studentsLabel = (row: PlatformOrganizationRow) => {
    const limit = PLAN_LIMITS[row.plan].maxStudents;
    return t("settings.academies.studentsUsed", {
      used: numberFmt.format(row.studentCount),
      limit:
        limit === null
          ? t("settings.academies.unlimited")
          : numberFmt.format(limit),
    });
  };

  const grantedLabel = (row: PlatformOrganizationRow) =>
    row.planGrantedBy && row.planGrantedAt
      ? t("settings.academies.grantedBy", {
          email: row.planGrantedBy,
          date: dateFmt.format(new Date(row.planGrantedAt)),
        })
      : t("settings.academies.notGranted");

  const columns: ColumnDef<PlatformOrganizationRow>[] = [
    {
      id: "academy",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("settings.academies.columnAcademy")}
        />
      ),
      meta: { label: t("settings.academies.columnAcademy") },
      cell: ({ row }) => (
        <AcademyCell
          row={row.original}
          compact={compact}
          t={t}
          studentsLabel={studentsLabel(row.original)}
          grantedLabel={grantedLabel(row.original)}
        />
      ),
    },
  ];

  if (!compact) {
    columns.push(
      {
        id: "adminEmail",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("settings.academies.columnAdminEmail")}
          />
        ),
        meta: { label: t("settings.academies.columnAdminEmail") },
        cell: ({ row }) => (
          <span dir="ltr">
            {row.original.adminEmail ?? t("settings.academies.noAdmin")}
          </span>
        ),
      },
      {
        id: "students",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("settings.academies.columnStudents")}
          />
        ),
        meta: { label: t("settings.academies.columnStudents") },
        cell: ({ row }) => studentsLabel(row.original),
      },
      {
        id: "granted",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("settings.academies.columnGranted")}
          />
        ),
        meta: { label: t("settings.academies.columnGranted") },
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {grantedLabel(row.original)}
          </span>
        ),
      },
    );
  }

  columns.push({
    id: "plan",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t("settings.academies.columnPlan")}
      />
    ),
    meta: { label: t("settings.academies.columnPlan") },
    cell: ({ row }) => (
      // Controlled by the stored plan: picking a value only *asks* for the
      // change, so Cancel in the confirm leaves the select where it was.
      <Select
        value={row.original.plan}
        disabled={pendingOrganizationId === row.original.id}
        onValueChange={(value) => {
          if (!value || value === row.original.plan) return;
          onRequestPlanChange({
            organization: row.original,
            plan: value as OrganizationPlan,
          });
        }}
      >
        <SelectTrigger
          size="sm"
          className="min-w-32"
          aria-label={t("settings.academies.planFor", {
            name: row.original.name,
          })}
        >
          <SelectValue>
            {(value) =>
              value ? t(`organizations.plan.${value as OrganizationPlan}`) : ""
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {organizationPlanValues.map((plan) => (
            <SelectItem key={plan} value={plan}>
              {t(`organizations.plan.${plan}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ),
  });

  return columns;
}

function AcademyCell({
  row,
  compact,
  t,
  studentsLabel,
  grantedLabel,
}: {
  row: PlatformOrganizationRow;
  compact: boolean;
  t: Translate;
  studentsLabel: string;
  grantedLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const detailsId = `academy-details-${row.id}`;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <span dir="auto" className="font-medium">
          {row.name}
        </span>
        {row.isMine ? <Tag>{t("settings.academies.yours")}</Tag> : null}
      </div>
      <span dir="ltr" className="self-start text-muted-foreground text-xs">
        {row.shortCode}
      </span>

      {compact ? (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ms-2 min-h-11 self-start"
            aria-expanded={open}
            aria-controls={detailsId}
            aria-label={t(
              open
                ? "settings.academies.hideDetails"
                : "settings.academies.showDetails",
              { name: row.name },
            )}
            onClick={() => setOpen((value) => !value)}
          >
            <ChevronDownIcon
              className={cn(
                "size-4 transition-transform motion-reduce:transition-none",
                open && "rotate-180",
              )}
            />
          </Button>
          {open ? (
            <dl
              id={detailsId}
              className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm"
            >
              <dt className="text-muted-foreground">
                {t("settings.academies.columnAdminEmail")}
              </dt>
              <dd dir="ltr" className="break-all text-start">
                {row.adminEmail ?? t("settings.academies.noAdmin")}
              </dd>
              <dt className="text-muted-foreground">
                {t("settings.academies.columnStudents")}
              </dt>
              <dd>{studentsLabel}</dd>
              <dt className="text-muted-foreground">
                {t("settings.academies.columnGranted")}
              </dt>
              <dd>{grantedLabel}</dd>
            </dl>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
