"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { H3, Muted } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import { groupByDay } from "@/features/system/live-classes/sessions/lib/day-groups";
import {
  MONTH_PARAM,
  WEEK_PARAM,
} from "@/features/system/live-classes/sessions/lib/view-anchor";
import {
  addIsoMonths,
  countInMonth,
  findTeacherOverlaps,
  type IsoDate,
  monthGridDates,
  monthStartOf,
  parseMonthParam,
  todayInZone,
  weekStartOf,
  zonedInstant,
} from "@/features/system/live-classes/sessions/lib/week";
import type { SessionRow } from "@/features/system/live-classes/sessions/server";
import { useTRPC } from "@/integrations/trpc/client";
import { cn } from "@/lib/utils";
import { DaySessionsCard } from "./day-sessions-card";
import { MonthCalendar } from "./month-calendar/month-calendar";
import { SessionEditDialog } from "./session-edit-dialog";
import { TeacherFilterSelect, useTeacherFilter } from "./teacher-filter";

const dayCardId = (date: IsoDate) => `sessions-day-${date}`;

/**
 * The month view of the schedule: the whole month's classes on one screen,
 * for planning rather than moving (the week grid does that).
 *
 * The month lives in `?month=` and the teacher in `?teacher=` (shared with the
 * week view). With no `?month=` the server picks the current month on the
 * academy's clock, and everything drawn — the label, the count, the grid —
 * comes from what the server answered, so the header can't name one month
 * over another month's grid while the next one loads.
 */
export function SessionsMonthView() {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: organization } = useQuery(
    trpc.organizations.getActive.queryOptions(),
  );
  const isStaff =
    organization?.role !== undefined && organization.role !== "student";

  const { teacherId, teacherOptions, selectedTeacher, setTeacher } =
    useTeacherFilter({ enabled: isStaff });

  const requestedMonth = parseMonthParam(searchParams.get(MONTH_PARAM));
  const { data, isLoading, isError, isPlaceholderData, refetch } = useQuery({
    ...trpc.sessions.month.queryOptions({
      month: requestedMonth ?? undefined,
      teacherId,
    }),
    placeholderData: keepPreviousData,
  });

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null) next.delete(key);
        else next.set(key, value);
      }
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const timeZone = data?.timeZone ?? organization?.timeZone ?? "UTC";
  const today = todayInZone(new Date(), timeZone);
  const monthStart = data?.monthStart;
  const rows = data?.rows ?? [];

  const dates = useMemo(
    () => (monthStart ? monthGridDates(monthStart, timeZone) : []),
    [monthStart, timeZone],
  );
  const overlaps = useMemo(
    () => findTeacherOverlaps(rows, timeZone),
    [rows, timeZone],
  );
  const inMonthCount = monthStart
    ? countInMonth(rows, monthStart, timeZone)
    : 0;
  const monthDays = useMemo(
    () =>
      monthStart
        ? groupByDay(rows, locale, timeZone).filter(
            (day) => day.date.slice(0, 7) === monthStart.slice(0, 7),
          )
        : [],
    [locale, monthStart, rows, timeZone],
  );

  const monthLabel = useMemo(() => {
    const at = monthStart ? zonedInstant(monthStart, 12 * 60, timeZone) : null;
    return at
      ? new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
          month: "long",
          year: "numeric",
          timeZone,
        }).format(at)
      : "";
  }, [locale, monthStart, timeZone]);

  const openWeek = (date: IsoDate) =>
    setParams({
      view: "week",
      [WEEK_PARAM]: weekStartOf(date, timeZone),
      [MONTH_PARAM]: null,
    });

  // "Today" on a phone also brings today's card into view once the current
  // month is showing — or the next day that has classes.
  const [scrollToToday, setScrollToToday] = useState(false);
  useEffect(() => {
    if (!scrollToToday || !monthStart || isPlaceholderData) return;
    if (monthStart !== monthStartOf(today)) return;
    const target = monthDays.find((day) => day.date >= today);
    if (target) {
      document
        .getElementById(dayCardId(target.date))
        ?.scrollIntoView({ block: "start" });
    }
    setScrollToToday(false);
  }, [isPlaceholderData, monthDays, monthStart, scrollToToday, today]);

  const [openSession, setOpenSession] = useState<SessionRow | null>(null);

  const emptyText = selectedTeacher
    ? t("sessions.month.emptyForTeacher", { name: selectedTeacher.label })
    : t("sessions.month.emptyMonth");
  const isEmpty = data !== undefined && inMonthCount === 0;

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "space-y-3 transition-opacity",
          isPlaceholderData && "opacity-60",
        )}
      >
        <div className="space-y-0.5">
          <H3>{monthLabel || " "}</H3>
          {data ? (
            <Muted className="text-xs">
              {t("sessions.month.classCount", { count: inMonthCount })}
            </Muted>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!monthStart}
              aria-label={t("sessions.month.previousMonth")}
              onClick={() =>
                monthStart &&
                setParams({ [MONTH_PARAM]: addIsoMonths(monthStart, -1) })
              }
            >
              <ChevronLeftIcon className="size-4 rtl:rotate-180" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setParams({ [MONTH_PARAM]: null });
                setScrollToToday(true);
              }}
            >
              {t("sessions.month.today")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!monthStart}
              aria-label={t("sessions.month.nextMonth")}
              onClick={() =>
                monthStart &&
                setParams({ [MONTH_PARAM]: addIsoMonths(monthStart, 1) })
              }
            >
              <ChevronRightIcon className="size-4 rtl:rotate-180" />
            </Button>
          </div>

          {isStaff ? (
            <div className="w-full sm:ms-auto sm:w-auto">
              <TeacherFilterSelect
                id="sessions-month-teacher-filter"
                teacherId={teacherId}
                teacherOptions={teacherOptions}
                onChange={setTeacher}
              />
            </div>
          ) : null}
        </div>
      </div>

      {data && !data.liveClassesEnabled ? (
        <Alert>
          <AlertDescription>
            {t("sessions.notConfiguredNotice")}
          </AlertDescription>
        </Alert>
      ) : null}

      {isError ? (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            {t("sessions.calendar.loadFailed")}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
            >
              {t("sessions.calendar.retry")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {isError && !data ? null : isLoading || !data || !monthStart ? (
        <Skeleton className="min-h-[60vh] w-full rounded-xl" />
      ) : (
        <>
          <div className="hidden space-y-3 lg:block">
            {isEmpty ? (
              <div className="flex flex-wrap items-center gap-2">
                <Muted>{emptyText}</Muted>
                {selectedTeacher ? (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setTeacher(null)}
                  >
                    {t("sessions.month.clearFilter")}
                  </Button>
                ) : null}
              </div>
            ) : null}
            <MonthCalendar
              dates={dates}
              monthStart={monthStart}
              today={today}
              timeZone={timeZone}
              sessions={rows}
              overlaps={overlaps}
              isStaff={isStaff}
              isStale={isPlaceholderData}
              onOpenSession={setOpenSession}
              onOpenWeek={openWeek}
            />
          </div>

          <div className="space-y-4 lg:hidden">
            {isEmpty ? (
              <EmptyState
                icon={<CalendarDaysIcon />}
                title={t("sessions.emptyTitle")}
                description={emptyText}
                action={
                  selectedTeacher ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setTeacher(null)}
                    >
                      {t("sessions.month.clearFilter")}
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              monthDays.map((day) => (
                <DaySessionsCard
                  key={day.date}
                  id={dayCardId(day.date)}
                  label={day.label}
                  sessions={day.sessions}
                  liveClassesEnabled={data.liveClassesEnabled}
                  timeZone={timeZone}
                  canOpenRegister={isStaff}
                  headerExtra={
                    isStaff && overlaps.byDate.has(day.date) ? (
                      <AlertTriangleIcon
                        className="size-4 shrink-0 text-warning"
                        role="img"
                        aria-label={t("sessions.month.overlapTitle")}
                      />
                    ) : null
                  }
                />
              ))
            )}
          </div>
        </>
      )}

      <SessionEditDialog
        session={openSession}
        open={openSession !== null}
        onOpenChange={(open) => {
          if (!open) setOpenSession(null);
        }}
        timeZone={timeZone}
        canEdit={isStaff}
        liveClassesEnabled={data?.liveClassesEnabled ?? false}
        teacherOptions={teacherOptions}
      />
    </div>
  );
}
