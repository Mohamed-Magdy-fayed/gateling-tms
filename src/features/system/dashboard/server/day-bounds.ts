import { TZDate } from "@date-fns/tz";

export type DayBounds = {
  /** First instant of the local day, inclusive. */
  start: Date;
  /** First instant of the next local day, exclusive. */
  end: Date;
};

/**
 * The UTC instants bounding "today" as the academy sees it.
 *
 * A session stored at 2026-03-10T16:00Z is on the 10th in Cairo and still the
 * 10th in London, but an 18:00 Cairo class in December is 16:00Z while the
 * same class in July is 15:00Z — so "today's sessions" can only be resolved
 * against the organization's own time zone (STATE.md D80), never the server's.
 *
 * Boundaries are built at local midnight through `TZDate`, which is what makes
 * a DST transition day come out 23 or 25 hours long rather than a hardcoded 24.
 * Kept pure and separate from the query so it can be unit-tested.
 */
export function getDayBoundsInZone(now: Date, timeZone: string): DayBounds {
  const local = new TZDate(now.getTime(), timeZone);
  const year = local.getFullYear();
  const month = local.getMonth();
  const day = local.getDate();

  const start = new TZDate(year, month, day, 0, 0, timeZone);
  // Day + 1 rather than start + 24h: on a spring-forward day the next local
  // midnight is 23 hours away, and adding a fixed 24 would spill an hour of
  // tomorrow's sessions into today.
  const end = new TZDate(year, month, day + 1, 0, 0, timeZone);

  return { start: new Date(start.getTime()), end: new Date(end.getTime()) };
}
