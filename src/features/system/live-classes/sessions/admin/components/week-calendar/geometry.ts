import {
  MINUTES_PER_DAY,
  SLOT_MINUTES,
} from "@/features/system/live-classes/sessions/lib/week";

/** Pixels per 15-minute slot: 12px makes an hour 48px, a 2h class 96px. */
export const SLOT_PX = 12;
export const HOUR_PX = SLOT_PX * (60 / SLOT_MINUTES);
export const GRID_HEIGHT_PX = HOUR_PX * 24;
/** The time-label gutter on the inline-start side. */
export const GUTTER_PX = 56;
/** How far a pointer must travel before a press becomes a drag. */
export const DRAG_THRESHOLD_PX = 4;

export function minutesToPx(minutes: number): number {
  return (minutes / SLOT_MINUTES) * SLOT_PX;
}

export function pxToMinutes(px: number): number {
  return (px / SLOT_PX) * SLOT_MINUTES;
}

/** Where a session sits on the grid: which column, and its vertical extent. */
export type Placement = {
  /** 0 = the week's first column (Saturday) … 6. */
  dayIndex: number;
  /** Minutes since local midnight, on the 15-minute grid. */
  start: number;
  durationMinutes: number;
};

export function clampPlacement(placement: Placement): Placement {
  const durationMinutes = Math.max(
    SLOT_MINUTES,
    Math.min(MINUTES_PER_DAY, placement.durationMinutes),
  );
  const start = Math.max(
    0,
    Math.min(MINUTES_PER_DAY - durationMinutes, placement.start),
  );
  return {
    dayIndex: Math.max(0, Math.min(6, placement.dayIndex)),
    start,
    durationMinutes,
  };
}

export function samePlacement(a: Placement, b: Placement): boolean {
  return (
    a.dayIndex === b.dayIndex &&
    a.start === b.start &&
    a.durationMinutes === b.durationMinutes
  );
}

/**
 * Which day column a pointer is over. Reads the grid's resolved direction
 * so the maths holds in RTL, where the gutter sits on the right and the
 * first column is the rightmost one.
 */
export function dayIndexAtPointer(grid: HTMLElement, clientX: number): number {
  const rect = grid.getBoundingClientRect();
  const isRtl = getComputedStyle(grid).direction === "rtl";
  const inlineOffset = isRtl ? rect.right - clientX : clientX - rect.left;
  const columnWidth = (rect.width - GUTTER_PX) / 7;
  const index = Math.floor((inlineOffset - GUTTER_PX) / columnWidth);
  return Math.max(0, Math.min(6, index));
}

/** Minutes since midnight for a pointer's vertical position inside a column. */
export function minutesAtPointer(column: HTMLElement, clientY: number): number {
  const rect = column.getBoundingClientRect();
  const minutes = pxToMinutes(clientY - rect.top);
  return Math.max(0, Math.min(MINUTES_PER_DAY, minutes));
}
