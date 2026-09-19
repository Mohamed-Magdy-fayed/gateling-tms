import {
  MINUTES_PER_DAY,
  minutesToTime,
  SLOT_MINUTES,
  timeToMinutes,
} from "@/features/system/live-classes/sessions/lib/week";

/**
 * One recurring weekly window a teacher can be booked in. Same shape as a
 * group's `GroupScheduleSlot`, kept as its own type because the two are
 * validated differently: an availability window may end at "24:00".
 */
export type AvailabilitySlot = {
  /** 0 = Sunday … 6 = Saturday. */
  day: number;
  startTime: string;
  endTime: string;
};

/** A window as minutes since midnight — what the merge logic works on. */
export type AvailabilityWindow = {
  day: number;
  start: number;
  end: number;
};

/** Ceiling on windows per teacher — six a day is already generous. */
export const MAX_AVAILABILITY_SLOTS = 42;

export function toAvailabilityWindow(
  slot: AvailabilitySlot,
): AvailabilityWindow | null {
  const start = timeToMinutes(slot.startTime);
  const end = timeToMinutes(slot.endTime);
  if (start === null || end === null) return null;
  if (!Number.isInteger(slot.day) || slot.day < 0 || slot.day > 6) return null;
  if (end <= start) return null;
  return { day: slot.day, start, end };
}

export function toAvailabilitySlot(
  window: AvailabilityWindow,
): AvailabilitySlot {
  return {
    day: window.day,
    startTime: minutesToTime(window.start),
    endTime: minutesToTime(window.end),
  };
}

/**
 * Sorted, snapped to the grid, and with overlapping or touching windows on
 * the same day merged into one. The stored form is always this: two windows
 * that meet at 18:00 are one window, and a "free 16:00–20:00" painted over a
 * "free 18:00–22:00" is "free 16:00–22:00", not two records that disagree
 * about where a border is.
 *
 * Unparseable slots are dropped rather than thrown on, for the same reason
 * groups/server/schedule.ts drops them: one bad row must not hide the rest.
 */
export function normalizeAvailability(
  slots: readonly AvailabilitySlot[],
): AvailabilitySlot[] {
  const windows = slots
    .map(toAvailabilityWindow)
    .filter((window): window is AvailabilityWindow => window !== null)
    .map((window) => ({
      day: window.day,
      start: snapDown(window.start),
      end: snapUp(window.end),
    }))
    .filter((window) => window.end > window.start)
    .sort((a, b) => a.day - b.day || a.start - b.start || a.end - b.end);

  const merged: AvailabilityWindow[] = [];
  for (const window of windows) {
    const last = merged.at(-1);
    if (last && last.day === window.day && window.start <= last.end) {
      merged[merged.length - 1] = {
        ...last,
        end: Math.max(last.end, window.end),
      };
      continue;
    }
    merged.push(window);
  }

  return merged.map(toAvailabilitySlot);
}

/** Adds a window (merging with neighbours) — what painting on the grid does. */
export function addAvailabilityWindow(
  slots: readonly AvailabilitySlot[],
  window: AvailabilityWindow,
): AvailabilitySlot[] {
  return normalizeAvailability([...slots, toAvailabilitySlot(window)]);
}

/** Drops exactly one stored window. */
export function removeAvailabilitySlot(
  slots: readonly AvailabilitySlot[],
  target: AvailabilitySlot,
): AvailabilitySlot[] {
  return slots.filter(
    (slot) =>
      !(
        slot.day === target.day &&
        slot.startTime === target.startTime &&
        slot.endTime === target.endTime
      ),
  );
}

/** Whether a class at `day`/`start`–`end` sits entirely inside one window. */
export function isWithinAvailability(
  slots: readonly AvailabilitySlot[],
  window: AvailabilityWindow,
): boolean {
  return slots.some((slot) => {
    const stored = toAvailabilityWindow(slot);
    return (
      stored !== null &&
      stored.day === window.day &&
      stored.start <= window.start &&
      stored.end >= window.end
    );
  });
}

function snapDown(minutes: number): number {
  return Math.max(0, Math.floor(minutes / SLOT_MINUTES) * SLOT_MINUTES);
}

function snapUp(minutes: number): number {
  return Math.min(
    MINUTES_PER_DAY,
    Math.ceil(minutes / SLOT_MINUTES) * SLOT_MINUTES,
  );
}
