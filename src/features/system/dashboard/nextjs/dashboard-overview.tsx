"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AwardIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { Tag } from "@/components/ui/tag";
import { useTranslation } from "@/features/core/i18n/client";
import { EnrollmentStatusTag } from "@/features/system/learning-flow/enrollments/admin";
import { useTRPC } from "@/integrations/trpc/client";

export function DashboardOverview() {
  const trpc = useTRPC();
  const { t, locale } = useTranslation();

  const { data: organization } = useQuery(
    trpc.organizations.getActive.queryOptions(),
  );
  const { data: overview, isLoading } = useQuery(
    trpc.dashboard.overview.queryOptions(),
  );
  // Students get a FORBIDDEN here by design (the strip names trainees), so the
  // query is only issued for the roles allowed to read it and the section is
  // simply absent otherwise — no failed request, no error toast.
  const isContentManager =
    organization?.role === "admin" || organization?.role === "teacher";
  const { data: activity } = useQuery({
    ...trpc.dashboard.recentActivity.queryOptions(),
    enabled: isContentManager,
  });

  const timeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
        timeStyle: "short",
        timeZone: overview?.timeZone ?? "UTC",
      }),
    [locale, overview?.timeZone],
  );

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
        dateStyle: "medium",
        timeZone: overview?.timeZone ?? "UTC",
      }),
    [locale, overview?.timeZone],
  );

  // "of 50 allowed" while a limit applies, nothing at all on an unlimited
  // plan — PLAN_LIMITS uses null for unlimited (enterprise), and rendering
  // "of null allowed" would be nonsense.
  function limitLabel(limit: number | null | undefined) {
    return limit === null || limit === undefined
      ? undefined
      : t("dashboard.stats.ofLimit", { limit });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-display font-bold text-2xl text-foreground">
            {organization
              ? t("dashboard.welcome.title", { orgName: organization.name })
              : t("dashboard.welcome.titleFallback")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("dashboard.welcome.subtitle")}
          </p>
        </div>
        {organization && (
          <Tag color="violet">
            {t(`organizations.plan.${organization.plan}`)}
          </Tag>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label={t("dashboard.stats.students")}
          value={overview?.counts.students ?? 0}
          description={limitLabel(overview?.limits.students)}
          icon={<UsersIcon />}
          tone="blue"
        />
        <StatCard
          label={t("dashboard.stats.courses")}
          value={overview?.counts.courses ?? 0}
          description={limitLabel(overview?.limits.courses)}
          icon={<BookOpenIcon />}
          tone="green"
        />
        <StatCard
          label={t("dashboard.stats.groups")}
          value={overview?.counts.groups ?? 0}
          icon={<CalendarDaysIcon />}
          tone="violet"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.today.title")}</CardTitle>
          <CardDescription>{t("dashboard.today.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : !overview || overview.todaysSessions.length === 0 ? (
            <EmptyState
              icon={<CalendarDaysIcon />}
              title={t("dashboard.today.emptyTitle")}
              description={t("dashboard.today.emptyDescription")}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href="/learning-flow/groups" />}
                >
                  {t("dashboard.today.groupsCta")}
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {overview.todaysSessions.map((session) => (
                <li
                  key={session.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/learning-flow/groups/${session.groupId}`}
                      className="truncate font-medium text-sm underline-offset-4 hover:underline"
                    >
                      {session.groupName}
                    </Link>
                    <p className="truncate text-muted-foreground text-xs">
                      {session.teacherName ?? t("groups.noTeacher")}
                      {` · ${t("dashboard.today.duration", {
                        minutes: session.durationMinutes,
                      })}`}
                    </p>
                  </div>
                  <span className="font-display font-bold text-foreground text-sm">
                    {timeFmt.format(session.scheduledAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {isContentManager ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.recent.enrollments")}</CardTitle>
            </CardHeader>
            <CardContent>
              {!activity || activity.enrollments.length === 0 ? (
                <EmptyState
                  icon={<UserCheckIcon />}
                  title={t("dashboard.recent.emptyTitle")}
                  description={t("dashboard.recent.enrollmentsEmpty")}
                />
              ) : (
                <ul className="divide-y divide-border">
                  {activity.enrollments.map((enrollment) => (
                    <li
                      key={enrollment.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/learning-flow/trainees/${enrollment.traineeId}`}
                          className="truncate font-medium text-sm underline-offset-4 hover:underline"
                        >
                          {enrollment.traineeName}
                        </Link>
                        <p className="truncate text-muted-foreground text-xs">
                          {enrollment.courseName} ·{" "}
                          {dateFmt.format(enrollment.at)}
                        </p>
                      </div>
                      <EnrollmentStatusTag status={enrollment.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.recent.certificates")}</CardTitle>
            </CardHeader>
            <CardContent>
              {!activity || activity.certificates.length === 0 ? (
                <EmptyState
                  icon={<AwardIcon />}
                  title={t("dashboard.recent.emptyTitle")}
                  description={t("dashboard.recent.certificatesEmpty")}
                />
              ) : (
                <ul className="divide-y divide-border">
                  {activity.certificates.map((certificate) => (
                    <li key={certificate.id} className="py-3">
                      <Link
                        href={`/certificates/${certificate.id}`}
                        className="truncate font-medium text-sm underline-offset-4 hover:underline"
                      >
                        {certificate.title}
                      </Link>
                      <p className="truncate text-muted-foreground text-xs">
                        {certificate.traineeName} ·{" "}
                        {dateFmt.format(certificate.at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
