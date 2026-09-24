"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Muted } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import { groupByDay } from "@/features/system/live-classes/sessions/lib/day-groups";
// The zod module directly, not the server barrel: the barrel also re-exports
// the meeting code, which pulls the database driver into the client bundle.
import {
  type SessionScope,
  sessionScopeValues,
} from "@/features/system/live-classes/sessions/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";
import { DaySessionsCard } from "./day-sessions-card";

const PER_PAGE = 20;

/**
 * The list view of the agenda: what is coming up, and what already ran.
 *
 * Days are the unit people think in, so rows are grouped under one heading per
 * day rather than listed flat — and the whole thing works with no Gateling
 * Meetings configured at all, which is the point of phase-06.md step 3's
 * "sessions stay offline gracefully". The week calendar
 * (sessions-week-view.tsx) is the other view of the same rows; this one is
 * what a phone shows best, and what a student mostly wants.
 */
export function SessionsAgenda() {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();

  const [scope, setScope] = useState<SessionScope>("upcoming");
  const [page, setPage] = useState(1);

  const { data: organization } = useQuery(
    trpc.organizations.getActive.queryOptions(),
  );
  const timeZone = organization?.timeZone ?? "UTC";
  // The register is admin-or-teacher; a student's agenda shows their classes
  // and how to join them, and stops there.
  const isStaff = organization ? organization.role !== "student" : false;

  const { data, isLoading } = useQuery(
    trpc.sessions.list.queryOptions({ page, perPage: PER_PAGE, scope }),
  );

  function changeScope(next: string) {
    if (!isSessionScope(next)) return;
    setScope(next);
    setPage(1);
  }

  const days = groupByDay(data?.rows ?? [], locale, timeZone);

  return (
    <div className="space-y-4">
      {data && !data.liveClassesEnabled ? (
        <Alert>
          <AlertDescription>
            {t("sessions.notConfiguredNotice")}
          </AlertDescription>
        </Alert>
      ) : null}

      <SegmentedControl
        size="sm"
        value={scope}
        onValueChange={changeScope}
        options={sessionScopeValues.map((value) => ({
          value,
          label: t(`sessions.scopeOptions.${value}`),
        }))}
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : days.length === 0 ? (
        <EmptyState
          icon={<CalendarDaysIcon />}
          title={t("sessions.emptyTitle")}
          description={t(
            scope === "upcoming"
              ? "sessions.emptyUpcoming"
              : "sessions.emptyPast",
          )}
        />
      ) : (
        <div className="space-y-4">
          {days.map((day) => (
            <DaySessionsCard
              key={day.date}
              label={day.label}
              sessions={day.sessions}
              liveClassesEnabled={data?.liveClassesEnabled ?? false}
              timeZone={timeZone}
              canOpenRegister={isStaff}
            />
          ))}
        </div>
      )}

      {data && data.pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={data.page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeftIcon className="size-3.5 rtl:rotate-180" />
            {t("sessions.previous")}
          </Button>
          <Muted className="text-xs">
            {t("sessions.pageOf", { page: data.page, total: data.pageCount })}
          </Muted>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={data.page >= data.pageCount}
            onClick={() => setPage((current) => current + 1)}
          >
            {t("sessions.next")}
            <ChevronRightIcon className="size-3.5 rtl:rotate-180" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function isSessionScope(value: string): value is SessionScope {
  return (sessionScopeValues as readonly string[]).includes(value);
}
