"use client";

import { AlertTriangleIcon, PencilLineIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslation } from "@/features/core/i18n/client";
import {
  type IsoDate,
  type TeacherOverlaps,
  zonedInstant,
  zonedParts,
} from "@/features/system/live-classes/sessions/lib/week";
import type { SessionRow } from "@/features/system/live-classes/sessions/server";
import { cn } from "@/lib/utils";
import { sessionAppearance } from "../session-appearance";

/** Chips a day cell shows before "+N more" takes over. */
const VISIBLE_CHIPS = 3;

type MonthCalendarProps = {
  /** Every grid date, whole weeks, Saturday first (lib/week.ts). */
  dates: IsoDate[];
  monthStart: IsoDate;
  today: IsoDate;
  timeZone: string;
  sessions: SessionRow[];
  overlaps: TeacherOverlaps;
  /** Staff see clash markers; a student's calendar has nothing to act on. */
  isStaff: boolean;
  /** The previous month is still shown while the next one loads. */
  isStale: boolean;
  onOpenSession: (session: SessionRow) => void;
  onOpenWeek: (date: IsoDate) => void;
};

/**
 * The month as a table: one row per week, one cell per day, a few chips per
 * day. Read-only on purpose — moving a class needs minutes, and the week
 * grid is where minutes live; a chip opens the class, a date opens its week.
 *
 * A `<table>` rather than a grid of divs so a screen reader announces the
 * weekday column with each cell. It follows the page's `dir`, so in Arabic
 * Saturday is the rightmost column with no per-locale code.
 */
export function MonthCalendar({
  dates,
  monthStart,
  today,
  timeZone,
  sessions,
  overlaps,
  isStaff,
  isStale,
  onOpenSession,
  onOpenWeek,
}: MonthCalendarProps) {
  const { t, locale } = useTranslation();
  const [openDay, setOpenDay] = useState<IsoDate | null>(null);
  const month = monthStart.slice(0, 7);

  const formatters = useMemo(() => {
    const lang = locale === "ar" ? "ar" : "en";
    return {
      weekday: new Intl.DateTimeFormat(lang, { weekday: "short", timeZone }),
      day: new Intl.DateTimeFormat(lang, { day: "numeric", timeZone }),
      fullDate: new Intl.DateTimeFormat(lang, { dateStyle: "full", timeZone }),
      time: new Intl.DateTimeFormat(lang, { timeStyle: "short", timeZone }),
    };
  }, [locale, timeZone]);

  const byDate = useMemo(() => {
    const map = new Map<IsoDate, SessionRow[]>();
    for (const session of sessions) {
      const date = zonedParts(session.scheduledAt, timeZone).date;
      map.set(date, [...(map.get(date) ?? []), session]);
    }
    // Live classes take the visible slots first; cancelled ones sort after
    // them, each group keeping start order (the server's).
    for (const [date, list] of map) {
      map.set(date, [
        ...list.filter((s) => s.status !== "cancelled"),
        ...list.filter((s) => s.status === "cancelled"),
      ]);
    }
    return map;
  }, [sessions, timeZone]);

  const sessionById = useMemo(
    () => new Map(sessions.map((session) => [session.id, session])),
    [sessions],
  );

  const noon = (date: IsoDate) => zonedInstant(date, 12 * 60, timeZone);
  const weeks = Array.from({ length: dates.length / 7 }, (_, row) =>
    dates.slice(row * 7, row * 7 + 7),
  );

  const renderChip = (
    session: SessionRow,
    inMonth: boolean,
    afterOpen?: () => void,
  ) => {
    const { color, statusClassName } = sessionAppearance(session);
    const time = formatters.time.format(session.scheduledAt);
    const clashes = isStaff && inMonth && overlaps.sessionIds.has(session.id);
    return (
      <button
        key={session.id}
        type="button"
        disabled={isStale}
        onClick={() => {
          afterOpen?.();
          onOpenSession(session);
        }}
        aria-label={[
          session.groupName,
          time,
          t(`sessions.statusOptions.${session.status}`),
          session.isAdjusted ? t("sessions.calendar.adjusted") : null,
        ]
          .filter(Boolean)
          .join(", ")}
        className={cn(
          "flex w-full min-w-0 items-center gap-1 rounded-sm border-s-2 px-1 py-0.5 text-start text-xs leading-tight outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed",
          color.block,
          statusClassName,
          clashes && "ring-1 ring-warning",
          !inMonth && "opacity-60",
        )}
      >
        <span className="shrink-0 tabular-nums opacity-80">{time}</span>
        <span className="truncate font-medium">{session.groupName}</span>
        {session.isAdjusted ? (
          <PencilLineIcon className="size-3 shrink-0 opacity-70" aria-hidden />
        ) : null}
      </button>
    );
  };

  const renderOverlapMarker = (date: IsoDate) => {
    const ids = overlaps.byDate.get(date);
    if (!isStaff || !ids?.length) return null;
    const clashing = ids
      .map((id) => sessionById.get(id))
      .filter((session): session is SessionRow => session !== undefined);
    const names = [
      ...new Set(clashing.map((session) => session.teacherName ?? "")),
    ].filter(Boolean);
    return (
      <Popover>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 text-warning"
              aria-label={t("sessions.month.overlapLabel", {
                name: names.join(", "),
              })}
            />
          }
        >
          <AlertTriangleIcon className="size-3.5" />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64">
          <PopoverTitle className="text-sm">
            {t("sessions.month.overlapTitle")}
          </PopoverTitle>
          <ul className="space-y-1">
            {clashing.map((session) => (
              <li key={session.id} className="flex justify-between gap-2">
                <span className="truncate">
                  {session.teacherName} · {session.groupName}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatters.time.format(session.scheduledAt)}
                </span>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <table
      className={cn(
        "w-full table-fixed border-collapse text-sm transition-opacity",
        isStale && "opacity-60",
      )}
    >
      <thead>
        <tr>
          {dates.slice(0, 7).map((date) => {
            const at = noon(date);
            return (
              <th
                key={date}
                scope="col"
                className="pb-2 text-start font-medium text-muted-foreground text-xs"
              >
                {at ? formatters.weekday.format(at) : date}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week) => (
          <tr key={week[0]}>
            {week.map((date) => {
              const at = noon(date);
              const inMonth = date.slice(0, 7) === month;
              const daySessions = byDate.get(date) ?? [];
              const hidden = daySessions.length - VISIBLE_CHIPS;
              const fullDate = at ? formatters.fullDate.format(at) : date;
              return (
                <td
                  key={date}
                  aria-label={fullDate}
                  className="h-28 border border-border p-1 align-top"
                >
                  <div className="mb-1 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenWeek(date)}
                      aria-label={fullDate}
                      className={cn(
                        "inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums outline-hidden hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                        !inMonth && "text-muted-foreground",
                        date === today &&
                          "bg-primary font-semibold text-primary-foreground hover:bg-primary",
                      )}
                    >
                      {at ? formatters.day.format(at) : date.slice(8)}
                    </button>
                    {inMonth ? renderOverlapMarker(date) : null}
                  </div>
                  <div className="space-y-0.5">
                    {daySessions
                      .slice(0, VISIBLE_CHIPS)
                      .map((session) => renderChip(session, inMonth))}
                    {hidden > 0 ? (
                      <Popover
                        open={openDay === date}
                        onOpenChange={(open) => setOpenDay(open ? date : null)}
                      >
                        <PopoverTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isStale}
                              className="h-6 w-full justify-start px-1 text-xs"
                              aria-label={t("sessions.month.openDay", {
                                count: hidden,
                                date: fullDate,
                              })}
                            />
                          }
                        >
                          {t("sessions.month.more", { count: hidden })}
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-72">
                          <PopoverTitle className="text-sm">
                            {fullDate}
                          </PopoverTitle>
                          <div className="space-y-1">
                            {daySessions.map((session) =>
                              renderChip(session, inMonth, () =>
                                setOpenDay(null),
                              ),
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setOpenDay(null);
                              onOpenWeek(date);
                            }}
                          >
                            {t("sessions.month.openInWeek")}
                          </Button>
                        </PopoverContent>
                      </Popover>
                    ) : null}
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
