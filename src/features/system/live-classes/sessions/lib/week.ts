import { TZDate } from "@date-fns/tz";

/**
 * The calendar's grid resolution. Every session start, duration, and
 * availability window is a multiple of this — the server rejects anything
 * else (`sessions.update`, `teacherAvailability.set`), and the week view
 * snaps drags to it.
 */
export const SLOT_MINUTES = 15;

export const MINUTES_PER_DAY = 24 * 60;

/**
 * Saturday. Academies here run Saturday-to-Friday weeks (Friday is the
 * weekend), so a "this week" that started on Sunday or Monday would split
 * the working week across two screens.
 */
export const WEEK_START_DAY = 6;

/** Weekday indexes (0 = Sunday … 6 = Saturday) in the order a week is shown. */
export const WEEK_DAY_ORDER = [6, 0, 1, 2, 3, 4, 5] as const;

/** "YYYY-MM-DD", zero-padded. */
export type IsoDate = string;

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
/** Zero-padded 24h "HH:mm", plus "24:00" for the end of a day. */
export const TIME_OF_DAY_PATTERN = /^(?:([01]\d|2[0-3]):([0-5]\d)|(24):(00))$/;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function toIsoDate(year: number, month: number, day: number): IsoDate {
  return `${String(year).padStart(4, "0")}-${pad2(month)}-${pad2(day)}`;
}

/** Splits "YYYY-MM-DD" into its parts; null for anything else. */
export function parseIsoDate(
  value: string,
): { year: number; month: number; day: number } | null {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

/**
 * Calendar-date arithmetic on UTC parts, so a DST transition can never add or
 * drop a day — the same reasoning as groups/server/schedule.ts's `addDays`.
 */
export function addIsoDays(date: IsoDate, days: number): IsoDate {
  const parts = parseIsoDate(date);
  if (!parts) return date;
  const shifted = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day + days),
  );
  return toIsoDate(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
  );
}

/** "HH:mm" → minutes since local midnight ("24:00" → 1440); null when malformed. */
export function timeToMinutes(value: string): number | null {
  const match = TIME_OF_DAY_PATTERN.exec(value);
  if (!match) return null;
  if (match[3]) return MINUTES_PER_DAY;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Minutes since midnight → "HH:mm", clamped to the day. `MINUTES_PER_DAY`
 * comes back as "24:00": it is the *end* of a day rather than a time of day,
 * and an availability window that runs to midnight needs to say so.
 */
export function minutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(MINUTES_PER_DAY, minutes));
  return `${pad2(Math.floor(clamped / 60))}:${pad2(clamped % 60)}`;
}

/** Nearest slot boundary, never outside the day. */
export function snapToSlot(minutes: number): number {
  const snapped = Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES;
  return Math.max(0, Math.min(MINUTES_PER_DAY, snapped));
}

/**
 * Nearest slot boundary for a *delta* — a drag distance — so it may be
 * negative. `snapToSlot` clamps to the day and would turn every upward drag
 * into "no change".
 */
export function roundToSlot(minutes: number): number {
  return Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES || 0;
}

export function isSlotAligned(minutes: number): boolean {
  return Number.isInteger(minutes) && minutes % SLOT_MINUTES === 0;
}

/**
 * Where an instant falls on the academy's calendar: its local date, weekday,
 * and minutes since local midnight. Everything the week grid positions by.
 */
export function zonedParts(
  instant: Date,
  timeZone: string,
): { date: IsoDate; dayOfWeek: number; minutesOfDay: number } {
  const local = new TZDate(instant.getTime(), timeZone);
  return {
    date: toIsoDate(local.getFullYear(), local.getMonth() + 1, local.getDate()),
    dayOfWeek: local.getDay(),
    minutesOfDay: local.getHours() * 60 + local.getMinutes(),
  };
}

/**
 * The inverse of `zonedParts`: a local date plus minutes since its midnight,
 * as a UTC instant. Built through `TZDate` so a wall-clock time keeps
 * meaning the same thing across a DST change.
 */
export function zonedInstant(
  date: IsoDate,
  minutesOfDay: number,
  timeZone: string,
): Date | null {
  const parts = parseIsoDate(date);
  if (!parts) return null;
  const zoned = new TZDate(
    parts.year,
    parts.month - 1,
    parts.day,
    Math.floor(minutesOfDay / 60),
    minutesOfDay % 60,
    timeZone,
  );
  const instant = new Date(zoned.getTime());
  return Number.isNaN(instant.getTime()) ? null : instant;
}

/** Today's local date in `timeZone`. */
export function todayInZone(now: Date, timeZone: string): IsoDate {
  return zonedParts(now, timeZone).date;
}

/**
 * The Saturday on or before `date` — the first day of the week that holds
 * it. Weekday is read at local noon so a midnight DST shift can't tip the
 * answer onto the neighbouring day (same care as schedule.ts).
 */
export function weekStartOf(date: IsoDate, timeZone: string): IsoDate {
  const parts = parseIsoDate(date);
  if (!parts) return date;
  const dayOfWeek = new TZDate(
    parts.year,
    parts.month - 1,
    parts.day,
    12,
    0,
    timeZone,
  ).getDay();
  const offset = (dayOfWeek - WEEK_START_DAY + 7) % 7;
  return addIsoDays(date, -offset);
}

/** The seven local dates of the week starting at `weekStart`, in order. */
export function weekDates(weekStart: IsoDate): IsoDate[] {
  return Array.from({ length: 7 }, (_, index) => addIsoDays(weekStart, index));
}

/**
 * The UTC instants bounding one local week: the first instant of
 * `weekStart`, inclusive, to the first instant of the day after its last
 * day, exclusive. Built from local midnights so a DST week is 167 or 169
 * hours long rather than a hardcoded 168 (dashboard/server/day-bounds.ts).
 */
export function weekBoundsInZone(
  weekStart: IsoDate,
  timeZone: string,
): { start: Date; end: Date } | null {
  const start = zonedInstant(weekStart, 0, timeZone);
  const end = zonedInstant(addIsoDays(weekStart, 7), 0, timeZone);
  if (!start || !end) return null;
  return { start, end };
}

export type LaidOutEvent<T> = {
  event: T;
  /** Zero-based column within its overlap cluster. */
  lane: number;
  /** How many columns the cluster needs; width is `1 / lanes`. */
  lanes: number;
};

/**
 * Google-Calendar-style side-by-side placement for events that overlap in
 * time. Events are grouped into clusters of transitive overlap; within a
 * cluster each event takes the lowest lane not occupied at its start, and
 * every event in the cluster shares the cluster's lane count so their widths
 * line up.
 *
 * Input order doesn't matter; the output is sorted by start, then by end
 * descending (longer first), which keeps lane assignment stable between
 * renders.
 */
export function layoutOverlaps<T>(
  events: readonly T[],
  bounds: (event: T) => { start: number; end: number },
): LaidOutEvent<T>[] {
  const sorted = events
    .map((event) => ({ event, ...bounds(event) }))
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const result: LaidOutEvent<T>[] = [];
  let cluster: { entry: (typeof sorted)[number]; lane: number }[] = [];
  let clusterEnd = Number.NEGATIVE_INFINITY;
  let laneEnds: number[] = [];

  const flush = () => {
    const lanes = Math.max(1, laneEnds.length);
    for (const { entry, lane } of cluster) {
      result.push({ event: entry.event, lane, lanes });
    }
    cluster = [];
    laneEnds = [];
    clusterEnd = Number.NEGATIVE_INFINITY;
  };

  for (const entry of sorted) {
    if (cluster.length > 0 && entry.start >= clusterEnd) flush();

    let lane = laneEnds.findIndex((end) => end <= entry.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(entry.end);
    } else {
      laneEnds[lane] = entry.end;
    }

    cluster.push({ entry, lane });
    clusterEnd = Math.max(clusterEnd, entry.end);
  }
  if (cluster.length > 0) flush();

  return result;
}

/** The first day of the month holding `date` ("YYYY-MM-01"). */
export function monthStartOf(date: IsoDate): IsoDate {
  const parts = parseIsoDate(date);
  if (!parts) return date;
  return toIsoDate(parts.year, parts.month, 1);
}

/**
 * `date` moved by whole months, clamped to the target month's last day, so
 * Jan 31 + 1 is Feb 28 (or 29) rather than spilling into March.
 */
export function addIsoMonths(date: IsoDate, months: number): IsoDate {
  const parts = parseIsoDate(date);
  if (!parts) return date;
  const target = new Date(Date.UTC(parts.year, parts.month - 1 + months, 1));
  const year = target.getUTCFullYear();
  const month = target.getUTCMonth() + 1;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return toIsoDate(year, month, Math.min(parts.day, lastDay));
}

/**
 * Every date the month grid draws: whole Saturday-to-Friday weeks from the
 * week holding the 1st to the week holding the last day. That is 4, 5 or 6
 * rows — a 28-day February that starts on a Saturday fills exactly four —
 * so callers read the row count as `length / 7` rather than assuming one.
 */
export function monthGridDates(
  monthStart: IsoDate,
  timeZone: string,
): IsoDate[] {
  const first = monthStartOf(monthStart);
  const lastOfMonth = addIsoDays(addIsoMonths(first, 1), -1);
  const gridStart = weekStartOf(first, timeZone);
  const gridEnd = addIsoDays(weekStartOf(lastOfMonth, timeZone), 7);
  const dates: IsoDate[] = [];
  for (let date = gridStart; date < gridEnd; date = addIsoDays(date, 1)) {
    dates.push(date);
  }
  return dates;
}

/**
 * The month grid's range: its first and one-past-last local dates, and the
 * UTC instants of their local midnights (start inclusive, end exclusive) —
 * the same construction as `weekBoundsInZone`, so a DST day is 23 or 25
 * hours and never a hardcoded 24.
 */
export function monthBoundsInZone(
  monthStart: IsoDate,
  timeZone: string,
): { gridStart: IsoDate; gridEnd: IsoDate; start: Date; end: Date } | null {
  if (!parseIsoDate(monthStart)) return null;
  const dates = monthGridDates(monthStart, timeZone);
  const gridStart = dates[0];
  const gridEnd = addIsoDays(dates[dates.length - 1], 1);
  const start = zonedInstant(gridStart, 0, timeZone);
  const end = zonedInstant(gridEnd, 0, timeZone);
  if (!start || !end) return null;
  return { gridStart, gridEnd, start, end };
}

/**
 * A `?month=` value from the URL, as the first of its month — or null for
 * anything that isn't a real calendar date. The shape check comes first
 * because `addIsoDays` hands malformed input back unchanged, so a
 * round-trip alone would wave "abc" through; the round-trip then catches
 * "2026-02-30" and "2026-13-01", which match the pattern but aren't dates.
 */
export function parseMonthParam(value: string | null): IsoDate | null {
  if (!value || !parseIsoDate(value)) return null;
  if (addIsoDays(value, 0) !== value) return null;
  return monthStartOf(value);
}

/** The fields the month-level helpers read off a session row. */
export type MonthSessionLike = {
  id: string;
  scheduledAt: Date;
  durationMinutes: number;
  status: string;
  teacherId: string | null;
};

/**
 * How many classes actually run in the month: sessions whose local date is
 * inside it, cancelled ones excluded. The grid also draws the neighbouring
 * months' leading and trailing days; those don't count.
 */
export function countInMonth(
  sessions: readonly MonthSessionLike[],
  monthStart: IsoDate,
  timeZone: string,
): number {
  const month = monthStartOf(monthStart).slice(0, 7);
  return sessions.filter(
    (session) =>
      session.status !== "cancelled" &&
      zonedParts(session.scheduledAt, timeZone).date.slice(0, 7) === month,
  ).length;
}

export type TeacherOverlaps = {
  /** Every session that overlaps another of the same teacher's. */
  sessionIds: Set<string>;
  /** Local date → the overlapping sessions that touch that day. */
  byDate: Map<IsoDate, string[]>;
};

/**
 * Where one teacher is booked twice at once. A per-teacher sweep in start
 * order over the whole range, not a per-day pairwise check, so a class that
 * runs past local midnight still clashes with the next day's first class.
 * Back-to-back is not an overlap (end is exclusive); cancelled classes and
 * classes with no teacher are ignored. Each clash is filed under every
 * local date its overlapping stretch covers.
 */
export function findTeacherOverlaps(
  sessions: readonly MonthSessionLike[],
  timeZone: string,
): TeacherOverlaps {
  const sessionIds = new Set<string>();
  const byDate = new Map<IsoDate, string[]>();
  const file = (date: IsoDate, id: string) => {
    const ids = byDate.get(date) ?? [];
    if (!ids.includes(id)) byDate.set(date, [...ids, id]);
  };

  const byTeacher = new Map<
    string,
    { id: string; start: number; end: number }[]
  >();
  for (const session of sessions) {
    if (session.status === "cancelled" || !session.teacherId) continue;
    const start = session.scheduledAt.getTime();
    const entry = {
      id: session.id,
      start,
      end: start + session.durationMinutes * 60_000,
    };
    byTeacher.set(session.teacherId, [
      ...(byTeacher.get(session.teacherId) ?? []),
      entry,
    ]);
  }

  for (const entries of byTeacher.values()) {
    const sorted = [...entries].sort(
      (a, b) => a.start - b.start || a.end - b.end,
    );
    let active: typeof sorted = [];
    for (const current of sorted) {
      active = active.filter((other) => other.end > current.start);
      for (const other of active) {
        sessionIds.add(other.id);
        sessionIds.add(current.id);
        const clashStart = new Date(current.start);
        const clashEnd = new Date(Math.min(current.end, other.end) - 1);
        const lastDate = zonedParts(clashEnd, timeZone).date;
        for (
          let date = zonedParts(clashStart, timeZone).date;
          date <= lastDate;
          date = addIsoDays(date, 1)
        ) {
          file(date, other.id);
          file(date, current.id);
        }
      }
      active = [...active, current];
    }
  }

  return { sessionIds, byDate };
}
