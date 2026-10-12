"use client";

import { useQuery } from "@tanstack/react-query";
import { AwardIcon, TriangleAlertIcon, UserCheckIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/features/core/i18n/client";
import { EnrollmentStatusTag } from "@/features/system/students/enrollments/admin";
import { useTRPC } from "@/integrations/trpc/client";

/** Rows the placeholder shows — the strip's own limit on the server. */
const PLACEHOLDER_KEYS = ["first", "second", "third", "fourth", "fifth"];

type RecentActivityCardsProps = {
  dateFmt: Intl.DateTimeFormat;
};

/**
 * Recent enrollments and certificates. Only rendered for the roles allowed to
 * read them (the strips name trainees), so the query is never issued for a
 * student.
 */
export function RecentActivityCards({ dateFmt }: RecentActivityCardsProps) {
  const trpc = useTRPC();
  const { t } = useTranslation();
  const {
    data: activity,
    isLoading,
    isError,
  } = useQuery(trpc.dashboard.recentActivity.queryOptions());
  const state = { isLoading, isError };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ActivityCard
        title={t("dashboard.recent.enrollments")}
        icon={<UserCheckIcon />}
        emptyDescription={t("dashboard.recent.enrollmentsEmpty")}
        isEmpty={!activity || activity.enrollments.length === 0}
        {...state}
      >
        {activity?.enrollments.map((enrollment) => (
          <li
            key={enrollment.id}
            className="flex flex-wrap items-center justify-between gap-2 py-3"
          >
            <div className="min-w-0">
              <Link
                href={`/students/${enrollment.traineeId}`}
                className="truncate rounded-sm font-medium text-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {enrollment.traineeName}
              </Link>
              <p className="truncate text-muted-foreground text-xs">
                {enrollment.courseName} · {dateFmt.format(enrollment.at)}
              </p>
            </div>
            <EnrollmentStatusTag status={enrollment.status} />
          </li>
        ))}
      </ActivityCard>

      <ActivityCard
        title={t("dashboard.recent.certificates")}
        icon={<AwardIcon />}
        emptyDescription={t("dashboard.recent.certificatesEmpty")}
        isEmpty={!activity || activity.certificates.length === 0}
        {...state}
      >
        {activity?.certificates.map((certificate) => (
          <li key={certificate.id} className="py-3">
            <Link
              href={`/certificates/${certificate.id}`}
              className="truncate rounded-sm font-medium text-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {certificate.title}
            </Link>
            <p className="truncate text-muted-foreground text-xs">
              {certificate.traineeName} · {dateFmt.format(certificate.at)}
            </p>
          </li>
        ))}
      </ActivityCard>
    </div>
  );
}

type ActivityCardProps = {
  title: string;
  icon: ReactNode;
  emptyDescription: string;
  isEmpty: boolean;
  isLoading: boolean;
  isError: boolean;
  children: ReactNode;
};

function ActivityCard({
  title,
  icon,
  emptyDescription,
  isEmpty,
  isLoading,
  isError,
  children,
}: ActivityCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ActivityPlaceholder />
        ) : isError ? (
          // A failed fetch must not read as "nothing happened yet".
          <EmptyState
            icon={<TriangleAlertIcon />}
            title={t("dashboard.recent.errorTitle")}
            description={t("errors.generic")}
          />
        ) : isEmpty ? (
          <EmptyState
            icon={icon}
            title={t("dashboard.recent.emptyTitle")}
            description={emptyDescription}
          />
        ) : (
          <ul className="divide-y divide-border">{children}</ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Same rhythm as the loaded rows, so nothing jumps when they arrive. */
function ActivityPlaceholder() {
  const { t } = useTranslation();
  return (
    <ul className="divide-y divide-border" aria-busy="true">
      <li className="sr-only">{t("common.loading")}</li>
      {PLACEHOLDER_KEYS.map((key) => (
        <li key={key} className="space-y-2 py-3" aria-hidden="true">
          <Skeleton className="h-4 w-2/5 motion-reduce:animate-none" />
          <Skeleton className="h-3 w-3/5 motion-reduce:animate-none" />
        </li>
      ))}
    </ul>
  );
}
