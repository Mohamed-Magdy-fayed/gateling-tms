"use client";

import { XIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/features/core/i18n/client";
import {
  type AvailabilitySlot,
  type AvailabilityWindow,
  toAvailabilityWindow,
} from "@/features/system/live-classes/availability/lib/slots";
import { isSessionEditable } from "@/features/system/live-classes/sessions/lib/session-editing";
import {
  type IsoDate,
  layoutOverlaps,
  MINUTES_PER_DAY,
  todayInZone,
  WEEK_DAY_ORDER,
  weekDates,
  zonedInstant,
  zonedParts,
} from "@/features/system/live-classes/sessions/lib/week";
import type { SessionRow } from "@/features/system/live-classes/sessions/server";
import { cn } from "@/lib/utils";
import {
  GRID_HEIGHT_PX,
  GUTTER_PX,
  HOUR_PX,
  minutesToPx,
  type Placement,
} from "./geometry";
import { SessionBlock } from "./session-block";
import {
  type PaintSelection,
  useAvailabilityPaint,
  useSessionDrag,
} from "./use-calendar-pointer";

export type WeekCalendarProps = {
  weekStart: IsoDate;
  timeZone: string;
  sessions: SessionRow[];
  /** The filtered teacher's windows, shaded behind the grid. */
  availability: AvailabilitySlot[];
  /** Whether the viewer may drag classes around (staff). */
  canEdit: boolean;
  /** Availability paint mode: drags on empty space create windows. */
  paintMode: boolean;
  /** Placements saved but not yet confirmed by a refetch, by session id. */
  pendingPlacements: Record<string, Placement>;
  onMoveSession: (session: SessionRow, placement: Placement) => void;
  onOpenSession: (session: SessionRow) => void;
  onPaintAvailability: (window: AvailabilityWindow) => void;
  onRemoveAvailability: (slot: AvailabilitySlot) => void;
};

/** Where the grid scrolls to on first paint when the week has no classes. */
const DEFAULT_SCROLL_HOUR = 8;
const NOW_TICK_MS = 60_000;
/** The 24 hour marks of the axis — a fixed list, not an index-keyed loop. */
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

type PlacedSession = { session: SessionRow; placement: Placement };

/**
 * A Google-Calendar-style week: seven day columns, a 24-hour vertical axis
 * on a 15-minute grid, classes as coloured blocks, and — when a teacher is
 * selected — their availability shaded behind everything.
 *
 * Everything is positioned in the academy's time zone, not the viewer's, so
 * the grid reads the same to a teacher abroad as to the admin in the office
 * (STATE.md D80). The grid's columns are in CSS `grid` order, which flips
 * with the document direction, so RTL needs no special handling here; only
 * the pointer maths in geometry.ts has to know.
 */
export function WeekCalendar({
  weekStart,
  timeZone,
  sessions,
  availability,
  canEdit,
  paintMode,
  pendingPlacements,
  onMoveSession,
  onOpenSession,
  onPaintAvailability,
  onRemoveAvailability,
}: WeekCalendarProps) {
  const { t, locale } = useTranslation();
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const formatters = useCalendarFormatters(locale, timeZone);

  const days = useMemo(() => weekDates(weekStart), [weekStart]);
  const now = useNow();
  const today = todayInZone(now, timeZone);
  const nowMinutes = zonedParts(now, timeZone).minutesOfDay;

  const sessionsById = useMemo(
    () => new Map(sessions.map((session) => [session.id, session])),
    [sessions],
  );

  const { active, blockHandlers, resizeHandlers } = useSessionDrag({
    gridRef,
    onCommit: useCallback(
      (sessionId: string, placement: Placement) => {
        const session = sessionsById.get(sessionId);
        if (session) onMoveSession(session, placement);
      },
      [onMoveSession, sessionsById],
    ),
    onClick: useCallback(
      (sessionId: string) => {
        const session = sessionsById.get(sessionId);
        if (session) onOpenSession(session);
      },
      [onOpenSession, sessionsById],
    ),
  });

  const { selection, columnHandlers } = useAvailabilityPaint({
    enabled: canEdit && paintMode,
    onPaint: useCallback(
      (paint: PaintSelection) =>
        onPaintAvailability({
          day: WEEK_DAY_ORDER[paint.dayIndex],
          start: paint.start,
          end: paint.end,
        }),
      [onPaintAvailability],
    ),
  });

  // Where each class is drawn this render: the in-flight drag wins, then a
  // pending save, then the stored time.
  const byDay = useMemo(() => {
    const columns: PlacedSession[][] = Array.from({ length: 7 }, () => []);
    for (const session of sessions) {
      const placement =
        active?.sessionId === session.id
          ? active.current
          : (pendingPlacements[session.id] ??
            placementOf(session, days, timeZone));
      if (!placement) continue;
      columns[placement.dayIndex].push({ session, placement });
    }
    return columns;
  }, [sessions, active, pendingPlacements, days, timeZone]);

  // First paint lands an hour above the earliest class, or at a sensible
  // morning hour when the week is empty — never at midnight.
  const earliestMinutes = useMemo(() => {
    const starts = byDay.flat().map(({ placement }) => placement.start);
    return starts.length > 0 ? Math.min(...starts) : DEFAULT_SCROLL_HOUR * 60;
  }, [byDay]);
  const scrolledRef = useRef(false);
  useEffect(() => {
    if (scrolledRef.current || !scrollRef.current) return;
    scrolledRef.current = true;
    scrollRef.current.scrollTop = Math.max(
      0,
      minutesToPx(earliestMinutes) - HOUR_PX,
    );
  }, [earliestMinutes]);

  const gridTemplateColumns = `${GUTTER_PX}px repeat(7, minmax(0, 1fr))`;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Day headings, outside the scroll container so they stay put. */}
      <div
        className="grid border-border border-b bg-muted/40"
        style={{ gridTemplateColumns }}
      >
        <div />
        {days.map((date) => {
          const isToday = date === today;
          return (
            <div
              key={date}
              className={cn(
                "flex flex-col items-center gap-0.5 border-border border-s py-2 text-xs",
                isToday && "text-primary",
              )}
            >
              <span className="uppercase tracking-wide opacity-70">
                {formatters.weekday(date)}
              </span>
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full font-semibold text-sm",
                  isToday && "bg-primary text-primary-foreground",
                )}
              >
                {formatters.dayNumber(date)}
              </span>
            </div>
          );
        })}
      </div>

      <div ref={scrollRef} className="max-h-[70vh] overflow-y-auto">
        <div
          ref={gridRef}
          className="relative grid"
          style={{ gridTemplateColumns, height: GRID_HEIGHT_PX }}
        >
          {/* Hour labels. Each sits on its line, nudged up so the text is
              centred on the rule rather than hanging below it. */}
          <div className="relative border-border border-e">
            {HOURS.map((hour) => (
              <span
                key={hour}
                className="-translate-y-1/2 absolute pe-1.5 text-[10px] text-muted-foreground leading-none"
                style={{ top: hour * HOUR_PX, insetInlineEnd: 0 }}
              >
                {hour === 0 ? null : formatters.hour(hour)}
              </span>
            ))}
          </div>

          {days.map((date, dayIndex) => {
            const weekday = WEEK_DAY_ORDER[dayIndex];
            const laidOut = layoutOverlaps(
              byDay[dayIndex],
              ({ placement }) => ({
                start: placement.start,
                end: placement.start + placement.durationMinutes,
              }),
            );
            const windows = availability
              .map((slot) => ({ slot, window: toAvailabilityWindow(slot) }))
              .filter(
                (
                  entry,
                ): entry is {
                  slot: AvailabilitySlot;
                  window: AvailabilityWindow;
                } => entry.window !== null && entry.window.day === weekday,
              );
            const isToday = date === today;

            return (
              <div
                key={date}
                className={cn(
                  "relative border-border border-s",
                  canEdit && paintMode && "cursor-crosshair touch-none",
                )}
                style={{
                  backgroundImage: HOUR_LINES,
                  backgroundSize: `100% ${HOUR_PX}px`,
                }}
                {...columnHandlers(dayIndex)}
              >
                {windows.map(({ slot, window }) => (
                  <div
                    key={`${slot.day}-${slot.startTime}`}
                    className="pointer-events-none absolute inset-x-0 rounded-sm bg-success/15 ring-1 ring-success/30 ring-inset"
                    style={{
                      top: minutesToPx(window.start),
                      height: minutesToPx(window.end - window.start),
                    }}
                    title={`${t("sessions.availability.legend")} · ${slot.startTime}–${slot.endTime}`}
                  >
                    {canEdit && paintMode ? (
                      <button
                        type="button"
                        className="pointer-events-auto absolute end-0.5 top-0.5 rounded-sm bg-card/80 p-0.5 text-muted-foreground hover:text-destructive"
                        aria-label={t("sessions.availability.remove")}
                        title={t("sessions.availability.remove")}
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => onRemoveAvailability(slot)}
                      >
                        <XIcon className="size-3" />
                      </button>
                    ) : null}
                  </div>
                ))}

                {selection && selection.dayIndex === dayIndex ? (
                  <div
                    className="pointer-events-none absolute inset-x-0 rounded-sm bg-success/30 ring-2 ring-success"
                    style={{
                      top: minutesToPx(selection.start),
                      height: minutesToPx(selection.end - selection.start),
                    }}
                  />
                ) : null}

                {laidOut.map(
                  ({ event: { session, placement }, lane, lanes }) => {
                    const editable =
                      canEdit && isSessionEditable(session.status);
                    return (
                      <SessionBlock
                        key={session.id}
                        session={session}
                        placement={placement}
                        lane={lane}
                        lanes={lanes}
                        timeLabel={formatters.timeRange(
                          date,
                          placement.start,
                          placement.durationMinutes,
                        )}
                        isDragging={active?.sessionId === session.id}
                        isPending={session.id in pendingPlacements}
                        editable={editable}
                        blockHandlers={
                          editable && !paintMode
                            ? blockHandlers(session.id, placement)
                            : null
                        }
                        resizeHandlers={
                          editable && !paintMode
                            ? resizeHandlers(session.id, placement)
                            : null
                        }
                        onOpen={() => onOpenSession(session)}
                      />
                    );
                  },
                )}

                {isToday ? (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 z-10 border-destructive border-t-2"
                    style={{ top: minutesToPx(nowMinutes) }}
                  >
                    <span className="-translate-y-1/2 absolute start-0 size-2 rounded-full bg-destructive" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** A 1px rule at the top of every hour, drawn by the column's background. */
const HOUR_LINES =
  "linear-gradient(to bottom, var(--color-border) 0, var(--color-border) 1px, transparent 1px)";

function placementOf(
  session: SessionRow,
  days: IsoDate[],
  timeZone: string,
): Placement | null {
  const parts = zonedParts(session.scheduledAt, timeZone);
  const dayIndex = days.indexOf(parts.date);
  if (dayIndex === -1) return null;
  return {
    dayIndex,
    start: parts.minutesOfDay,
    // A class that runs past midnight is drawn to the bottom of its day.
    durationMinutes: Math.min(
      session.durationMinutes,
      MINUTES_PER_DAY - parts.minutesOfDay,
    ),
  };
}

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), NOW_TICK_MS);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/**
 * Formatting for the grid, all in the academy's zone. Dates are calendar
 * dates rather than instants, so each is formatted through its local noon —
 * a time no DST rule ever skips.
 */
function useCalendarFormatters(locale: string, timeZone: string) {
  return useMemo(() => {
    const tag = locale === "ar" ? "ar" : "en";
    const weekdayFmt = new Intl.DateTimeFormat(tag, {
      weekday: "short",
      timeZone,
    });
    const dayFmt = new Intl.DateTimeFormat(tag, { day: "numeric", timeZone });
    const hourFmt = new Intl.DateTimeFormat(tag, {
      hour: "numeric",
      timeZone: "UTC",
    });
    const timeFmt = new Intl.DateTimeFormat(tag, {
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    });
    const noon = (date: IsoDate) =>
      zonedInstant(date, 12 * 60, timeZone) ?? new Date(NaN);

    return {
      weekday: (date: IsoDate) => weekdayFmt.format(noon(date)),
      dayNumber: (date: IsoDate) => dayFmt.format(noon(date)),
      hour: (hour: number) =>
        hourFmt.format(new Date(Date.UTC(2000, 0, 1, hour))),
      timeRange: (date: IsoDate, start: number, durationMinutes: number) => {
        const from = zonedInstant(date, start, timeZone);
        const to = zonedInstant(date, start + durationMinutes, timeZone);
        if (!from || !to) return "";
        return timeFmt.formatRange(from, to);
      },
    };
  }, [locale, timeZone]);
}
