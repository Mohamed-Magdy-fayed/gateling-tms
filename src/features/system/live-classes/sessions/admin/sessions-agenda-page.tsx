"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { H2, Muted } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import type { SessionRow } from "@/features/system/live-classes/sessions/server";
// The zod module directly, not the server barrel: the barrel also re-exports
// the meeting code, which pulls the database driver into the client bundle.
import {
  type SessionScope,
  sessionScopeValues,
} from "@/features/system/live-classes/sessions/server/schemas";
import { useTRPC } from "@/integrations/trpc/client";
import { SessionList } from "./components";

const PER_PAGE = 20;

/**
 * The org's live-class agenda: what is coming up, and what already ran.
 *
 * Days are the unit people think in, so rows are grouped under one heading per
 * day rather than listed flat — and the whole thing works with no Zoom
 * connected at all, which is the point of phase-06.md step 3's "sessions stay
 * offline gracefully".
 */
export function SessionsAgendaPage() {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();

  const [scope, setScope] = useState<SessionScope>("upcoming");
  const [page, setPage] = useState(1);

  const { data: organization } = useQuery(
    trpc.organizations.getActive.queryOptions(),
  );
  const timeZone = organization?.timeZone ?? "UTC";

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
    <div className="space-y-6">
      <div className="space-y-1">
        <H2>{t("sessions.title")}</H2>
        {/* Says exactly what the product does and where the class itself
            happens — the same promise the landing page makes (D8). */}
        <Muted>{t("sessions.lead")}</Muted>
      </div>

      {data && !data.hasActiveZoomClient ? (
        <Alert>
          <AlertDescription>
            {t("sessions.noZoomAccount")}{" "}
            <Link className="underline" href="/live-classes/zoom-clients">
              {t("sessions.connectZoom")}
            </Link>
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
            <Card key={day.label}>
              <CardHeader>
                <CardTitle className="text-base">{day.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <SessionList
                  sessions={day.sessions}
                  hasActiveZoomClient={data?.hasActiveZoomClient ?? false}
                  timeZone={timeZone}
                  showGroup
                />
              </CardContent>
            </Card>
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

/**
 * One heading per calendar day *in the academy's zone* — grouping on the
 * viewer's local day would split an evening class across two headings for
 * anyone in a different country.
 */
function groupByDay(
  sessions: SessionRow[],
  locale: string,
  timeZone: string,
): { label: string; sessions: SessionRow[] }[] {
  const dayFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    timeZone,
    dateStyle: "full",
  });

  const days: { label: string; sessions: SessionRow[] }[] = [];

  for (const session of sessions) {
    const label = dayFmt.format(session.scheduledAt);
    const currentDay = days.at(-1);

    if (currentDay?.label === label) {
      currentDay.sessions.push(session);
      continue;
    }

    days.push({ label, sessions: [session] });
  }

  return days;
}
