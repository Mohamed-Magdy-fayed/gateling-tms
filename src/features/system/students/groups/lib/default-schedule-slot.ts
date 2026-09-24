import type { GroupScheduleSlot } from "@/drizzle/schema";

const DEFAULT_SLOT_DAY = 1;
const DEFAULT_SLOT_START = "18:00";
const MINUTES_PER_DAY = 24 * 60;

/** `"HH:MM"` plus `minutes`, capped at 23:59 so a slot never wraps past midnight. */
export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const total = Math.min(hours * 60 + mins + minutes, MINUTES_PER_DAY - 1);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/**
 * The slot "Add time slot" starts from: Monday at 18:00, as long as the
 * academy's default class length (academy preference 00001). The operator
 * edits it from there; nothing already scheduled is touched.
 */
export function defaultScheduleSlot(classMinutes: number): GroupScheduleSlot {
  return {
    day: DEFAULT_SLOT_DAY,
    startTime: DEFAULT_SLOT_START,
    endTime: addMinutesToTime(DEFAULT_SLOT_START, classMinutes),
  };
}
