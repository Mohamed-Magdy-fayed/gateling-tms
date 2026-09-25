import { type IsoDate, zonedParts } from "./week";

export type DayGroup<T> = {
  /** The local date in the academy's zone — what callers filter and key on. */
  date: IsoDate;
  /** That date written out in full for the viewer's language. */
  label: string;
  sessions: T[];
};

/**
 * Sessions grouped under one heading per calendar day *in the academy's
 * zone* — grouping on the viewer's local day would split an evening class
 * across two headings for anyone in a different country. Keeps the input
 * order, both of days and of sessions within a day.
 */
export function groupByDay<T extends { scheduledAt: Date }>(
  sessions: readonly T[],
  locale: string,
  timeZone: string,
): DayGroup<T>[] {
  const dayFmt = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    timeZone,
    dateStyle: "full",
  });

  const days = new Map<IsoDate, DayGroup<T>>();
  for (const session of sessions) {
    const date = zonedParts(session.scheduledAt, timeZone).date;
    const day = days.get(date);
    if (day) {
      day.sessions.push(session);
      continue;
    }
    days.set(date, {
      date,
      label: dayFmt.format(session.scheduledAt),
      sessions: [session],
    });
  }
  return [...days.values()];
}
