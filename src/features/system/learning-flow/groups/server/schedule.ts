import { TZDate } from "@date-fns/tz";
import type { GroupScheduleSlot } from "@/drizzle/schema";

/**
 * Hard ceiling on how many sessions one group may generate, independent of
 * whatever `sessionCount` the schema let through. Defence in depth: the
 * generator writes a row per occurrence, so a bad count is a write amplifier.
 */
export const MAX_GENERATED_SESSIONS = 200;

/** Weekly slots a single group may define — two per day is already generous. */
export const MAX_SCHEDULE_SLOTS = 14;

/** "HH:mm", 24h, zero-padded. Rejects "9:00", "24:00", "18:5". */
const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** "YYYY-MM-DD". Range-checked separately — this only fixes the shape. */
const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export type SessionOccurrence = {
  scheduledAt: Date;
  durationMinutes: number;
};

type NormalizedSlot = {
  day: number;
  startHour: number;
  startMinute: number;
  durationMinutes: number;
};

type CalendarDate = { year: number; month: number; day: number };

function parseTimeOfDay(
  value: string,
): { hour: number; minute: number } | null {
  const match = TIME_OF_DAY_PATTERN.exec(value);
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

/**
 * Drops slots the generator can't act on rather than throwing: `schedule` is
 * a jsonb column, so a row written before a validation rule tightened can
 * still be read back. One bad slot must not stop a group's other slots from
 * generating.
 */
function normalizeSlots(schedule: GroupScheduleSlot[]): NormalizedSlot[] {
  const normalized: NormalizedSlot[] = [];

  for (const slot of schedule.slice(0, MAX_SCHEDULE_SLOTS)) {
    if (!Number.isInteger(slot.day) || slot.day < 0 || slot.day > 6) continue;

    const start = parseTimeOfDay(slot.startTime);
    const end = parseTimeOfDay(slot.endTime);
    if (!start || !end) continue;

    const durationMinutes =
      end.hour * 60 + end.minute - (start.hour * 60 + start.minute);
    if (durationMinutes <= 0) continue;

    normalized.push({
      day: slot.day,
      startHour: start.hour,
      startMinute: start.minute,
      durationMinutes,
    });
  }

  // Same weekday first, earlier time first — keeps a single day's output in
  // wall-clock order once the walk below groups by date.
  return normalized.sort(
    (a, b) =>
      a.day - b.day ||
      a.startHour - b.startHour ||
      a.startMinute - b.startMinute,
  );
}

/**
 * Rejects dates the `Date` constructor would silently normalize
 * (2026-02-30 → March 2nd) instead of accepting a shifted schedule start.
 */
function parseCalendarDate(value: string): CalendarDate | null {
  const match = CALENDAR_DATE_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

/**
 * Advances a calendar date by whole days. Done on UTC parts rather than on a
 * zoned date so a DST transition can never add or drop a day — the calendar
 * is the same everywhere, only the instants a day maps to differ.
 */
function addDays(date: CalendarDate, days: number): CalendarDate {
  const shifted = new Date(
    Date.UTC(date.year, date.month - 1, date.day + days),
  );
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

/** Day of week (0 = Sunday) as seen in `timeZone`, read at local noon so a
 * midnight DST shift can't tip the answer onto the neighbouring day. */
function dayOfWeekInZone(date: CalendarDate, timeZone: string): number {
  return new TZDate(
    date.year,
    date.month - 1,
    date.day,
    12,
    0,
    timeZone,
  ).getDay();
}

/**
 * Expands a group's weekly wall-clock schedule into concrete session instants.
 *
 * The schedule is an open-ended pattern ("Mondays 18:00–20:00"); `startDate`
 * and `sessionCount` bound it. Times are wall-clock in `timeZone`, so a group
 * that meets at 18:00 keeps meeting at 18:00 across a DST transition even
 * though the underlying UTC instant shifts.
 *
 * Returns chronologically ordered occurrences, at most `sessionCount` of them
 * (further capped by MAX_GENERATED_SESSIONS). An empty schedule, an
 * unparseable `startDate`, or a non-positive count yields an empty list.
 */
export function generateSessionOccurrences(input: {
  schedule: GroupScheduleSlot[];
  startDate: string;
  sessionCount: number;
  timeZone: string;
}): SessionOccurrence[] {
  const slots = normalizeSlots(input.schedule);
  const start = parseCalendarDate(input.startDate);
  if (slots.length === 0 || !start) return [];

  if (!Number.isInteger(input.sessionCount) || input.sessionCount <= 0) {
    return [];
  }
  const limit = Math.min(input.sessionCount, MAX_GENERATED_SESSIONS);

  // Worst case is one slot per week, so `limit` weeks always suffices; the
  // trailing week absorbs a start date that falls after this week's slot.
  const maxDaysToWalk = limit * 7 + 7;

  const occurrences: SessionOccurrence[] = [];
  const seen = new Set<number>();

  for (
    let dayOffset = 0;
    dayOffset < maxDaysToWalk && occurrences.length < limit;
    dayOffset += 1
  ) {
    const date = addDays(start, dayOffset);
    const dayOfWeek = dayOfWeekInZone(date, input.timeZone);

    for (const slot of slots) {
      if (slot.day !== dayOfWeek) continue;
      if (occurrences.length >= limit) break;

      const scheduledAt = new Date(
        new TZDate(
          date.year,
          date.month - 1,
          date.day,
          slot.startHour,
          slot.startMinute,
          input.timeZone,
        ).getTime(),
      );

      // Two slots can collapse onto one instant when a DST spring-forward
      // maps both wall-clock times into the same moment; the unique index on
      // (groupId, scheduledAt) would reject the second anyway.
      if (Number.isNaN(scheduledAt.getTime())) continue;
      if (seen.has(scheduledAt.getTime())) continue;
      seen.add(scheduledAt.getTime());

      occurrences.push({ scheduledAt, durationMinutes: slot.durationMinutes });
    }
  }

  return occurrences;
}
