"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  TriangleAlertIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { type ComponentProps, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Tag } from "@/components/ui/tag";
import { H1, Muted } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import { TestimonialPromptCard } from "@/features/marketing/testimonials/admin";
import { useTRPC } from "@/integrations/trpc/client";
import { BranchBreakdownCard } from "./branch-breakdown-card";
import { RecentActivityCards } from "./recent-activity-cards";

/** Rows the schedule placeholder shows while today's classes load. */
const SCHEDULE_PLACEHOLDER_KEYS = ["first", "second", "third"];

export function DashboardOverview() {
  const trpc = useTRPC();
  const { t, locale } = useTranslation();
  const intlLocale = locale === "ar" ? "ar" : "en";

  const { data: organization } = useQuery(
    trpc.organizations.getActive.queryOptions(),
  );
  const {
    data: overview,
    isLoading,
    isError,
  } = useQuery(trpc.dashboard.overview.queryOptions());
  // Students may read the dashboard but not the lists behind it, so only
  // content managers get the recent-activity strips and clickable tiles.
  const isContentManager =
    organization?.role === "admin" || organization?.role === "teacher";

  const timeZone = overview?.timeZone ?? "UTC";
  const timeFmt = useMemo(
    () => new Intl.DateTimeFormat(intlLocale, { timeStyle: "short", timeZone }),
    [intlLocale, timeZone],
  );
  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(intlLocale, { dateStyle: "medium", timeZone }),
    [intlLocale, timeZone],
  );
  const numberFmt = useMemo(
    () => new Intl.NumberFormat(intlLocale),
    [intlLocale],
  );

  // "of 50 allowed" while a limit applies, nothing at all on an unlimited
  // plan — PLAN_LIMITS uses null for unlimited (enterprise), and rendering
  // "of null allowed" would be nonsense. Limits are academy-wide, so the
  // server leaves them out when the tiles are narrowed to a branch.
  function limitLabel(limit: number | null | undefined) {
    return limit === null || limit === undefined
      ? undefined
      : t("dashboard.stats.ofLimit", { limit });
  }

  // A placeholder while loading and a dash on failure — a 0 would be a claim
  // about the academy.
  function statValue(value: number | undefined) {
    if (isLoading) {
      return (
        <>
          <span className="sr-only">{t("common.loading")}</span>
          <Skeleton
            aria-hidden="true"
            className="inline-block h-6 w-14 align-middle motion-reduce:animate-none"
          />
        </>
      );
    }
    if (isError || value === undefined) return "—";
    return numberFmt.format(value);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          {/* No tracking-tight here: the title carries Arabic too. */}
          <H1 className="font-display text-2xl text-foreground tracking-normal lg:text-2xl">
            {organization
              ? t("dashboard.welcome.title", { orgName: organization.name })
              : t("dashboard.welcome.titleFallback")}
          </H1>
          <Muted>{t("dashboard.welcome.subtitle")}</Muted>
        </div>
        {organization && (
          <Tag color="violet">
            {t(`organizations.plan.${organization.plan}`)}
          </Tag>
        )}
      </div>

      <TestimonialPromptCard isAdmin={organization?.role === "admin"} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          href={isContentManager ? "/students" : undefined}
          label={t("dashboard.stats.students")}
          value={statValue(overview?.counts.students)}
          description={limitLabel(overview?.limits?.students)}
          icon={<UsersIcon />}
          tone="blue"
        />
        <StatTile
          href={isContentManager ? "/content-library/courses" : undefined}
          label={t("dashboard.stats.courses")}
          value={statValue(overview?.counts.courses)}
          description={
            overview?.isNarrowed
              ? t("dashboard.stats.taughtHere")
              : limitLabel(overview?.limits?.courses)
          }
          icon={<BookOpenIcon />}
          tone="green"
        />
        <StatTile
          href={isContentManager ? "/students/groups" : undefined}
          label={t("dashboard.stats.groups")}
          value={statValue(overview?.counts.groups)}
          icon={<CalendarDaysIcon />}
          tone="violet"
        />
      </div>

      {overview?.branches ? (
        <BranchBreakdownCard branches={overview.branches} />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.today.title")}</CardTitle>
          <CardDescription>{t("dashboard.today.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SchedulePlaceholder />
          ) : isError ? (
            // A failed fetch also leaves `overview` undefined — saying so beats
            // rendering "nothing scheduled", which is a claim about the day.
            <EmptyState
              icon={<TriangleAlertIcon />}
              title={t("dashboard.today.errorTitle")}
              description={t("errors.generic")}
            />
          ) : !overview || overview.todaysSessions.length === 0 ? (
            <EmptyState
              icon={<CalendarDaysIcon />}
              title={t("dashboard.today.emptyTitle")}
              description={t("dashboard.today.emptyDescription")}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href="/students/groups" />}
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
                      href={`/students/groups/${session.groupId}`}
                      className="truncate rounded-sm font-medium text-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  <span className="font-bold font-display text-foreground text-sm">
                    {timeFmt.format(session.scheduledAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {isContentManager ? <RecentActivityCards dateFmt={dateFmt} /> : null}
    </div>
  );
}

type StatTileProps = ComponentProps<typeof StatCard> & {
  /** Where the number comes from; omitted for roles that can't open it. */
  href?: string;
};

/** A stat card that opens the list behind its number when it has one. */
function StatTile({ href, className, ...props }: StatTileProps) {
  if (!href) return <StatCard className={className} {...props} />;
  return (
    <Link
      href={href}
      className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <StatCard
        className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-accent/40 motion-reduce:transition-none"
        {...props}
      />
    </Link>
  );
}

/** Same rhythm as a loaded schedule row, so nothing jumps when it arrives. */
function SchedulePlaceholder() {
  const { t } = useTranslation();
  return (
    <ul className="divide-y divide-border" aria-busy="true">
      <li className="sr-only">{t("common.loading")}</li>
      {SCHEDULE_PLACEHOLDER_KEYS.map((key) => (
        <li
          key={key}
          className="flex items-center justify-between gap-2 py-3"
          aria-hidden="true"
        >
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5 motion-reduce:animate-none" />
            <Skeleton className="h-3 w-1/4 motion-reduce:animate-none" />
          </div>
          <Skeleton className="h-4 w-12 motion-reduce:animate-none" />
        </li>
      ))}
    </ul>
  );
}
