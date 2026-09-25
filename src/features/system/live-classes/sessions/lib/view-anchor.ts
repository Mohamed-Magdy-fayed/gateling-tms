import {
  addIsoDays,
  type IsoDate,
  monthStartOf,
  parseMonthParam,
  weekStartOf,
} from "./week";

export const SESSION_VIEWS = ["week", "month", "list"] as const;
export type SessionView = (typeof SESSION_VIEWS)[number];

export const WEEK_PARAM = "week";
export const MONTH_PARAM = "month";

/**
 * The URL params for switching between calendar views without losing your
 * place: the week you were looking at opens its month, and the month opens
 * the week you most likely meant.
 *
 * - Week → Month: today's month when today is in the viewed week, otherwise
 *   the month holding the week's 4th day. Weeks run Saturday to Friday, so
 *   the 4th day is the one whose month owns most of the week — the ISO
 *   "Thursday" rule would be the 6th day here and pick the wrong month.
 * - Month → Week: today's week when today is in the viewed month, otherwise
 *   the week holding the 1st.
 * - The list has no anchor: switching to or from it leaves both params as
 *   they are, so coming back lands where you left.
 *
 * With no anchor to carry (no `?week=`/`?month=`, meaning "now"), the other
 * view's param is dropped so it opens on now too.
 */
export function viewAnchorParams(
  from: SessionView,
  to: SessionView,
  params: URLSearchParams,
  today: IsoDate,
  timeZone: string,
): URLSearchParams {
  const next = new URLSearchParams(params.toString());
  if (from === to || from === "list" || to === "list") return next;

  if (to === "month") {
    const week = params.get(WEEK_PARAM);
    next.delete(WEEK_PARAM);
    if (!week) {
      next.delete(MONTH_PARAM);
      return next;
    }
    const weekStart = weekStartOf(week, timeZone);
    const todayInWeek = today >= weekStart && today <= addIsoDays(weekStart, 6);
    next.set(
      MONTH_PARAM,
      monthStartOf(todayInWeek ? today : addIsoDays(weekStart, 3)),
    );
    return next;
  }

  const month = parseMonthParam(params.get(MONTH_PARAM));
  next.delete(MONTH_PARAM);
  if (!month) {
    next.delete(WEEK_PARAM);
    return next;
  }
  const todayInMonth = monthStartOf(today) === month;
  next.set(WEEK_PARAM, weekStartOf(todayInMonth ? today : month, timeZone));
  return next;
}
