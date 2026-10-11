/** Stored in TanStack column filter state (serializable). */
export type DataTableDateRangeValue = {
  from?: string;
  to?: string;
};

export type DataTableNumberRangeValue = {
  min?: number;
  max?: number;
};

export function toYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseLocalDateStart(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

export function parseLocalDateEnd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 23, 59, 59, 999);
}

export function isDateRangeValue(v: unknown): v is DataTableDateRangeValue {
  if (v == null || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (!("from" in o) && !("to" in o)) return false;
  if (o.from != null && typeof o.from !== "string") return false;
  if (o.to != null && typeof o.to !== "string") return false;
  return true;
}

export function isNumberRangeValue(v: unknown): v is DataTableNumberRangeValue {
  if (v == null || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  const ok = (x: unknown) => x === undefined || typeof x === "number";
  return ok(o.min) && ok(o.max);
}

/**
 * Convert a `{from, to}` YMD range into UTC ISO datetime instants using the
 * **caller's local timezone** for the day boundaries.
 *
 * Use this on the client right before sending filters to the server so the
 * comparison is anchored to the user's day rather than the server's (which
 * is almost always UTC). The server can then `new Date(s)` directly.
 */
export function dateRangeToWireBounds(
  value: DataTableDateRangeValue,
): DataTableDateRangeValue {
  const out: DataTableDateRangeValue = {};
  const f = value.from?.trim();
  const tt = value.to?.trim();
  if (f) out.from = parseLocalDateStart(f).toISOString();
  if (tt) out.to = parseLocalDateEnd(tt).toISOString();
  return out;
}

/**
 * Walk the table's column filter state and replace any `{from, to}` YMD
 * values with their `dateRangeToWireBounds` UTC counterparts so the server
 * receives unambiguous timestamps.
 */
export function serializeColumnFiltersForServer<
  F extends { id: string; value: unknown },
>(filters: F[]): F[] {
  return filters.map((f) => {
    if (isDateRangeValue(f.value)) {
      return { ...f, value: dateRangeToWireBounds(f.value) };
    }
    return f;
  });
}

/** Day-only comparison: row timestamp must fall within [from, to] local-midnight bounds. */
export function rowTimestampInYmdRange(
  value: Date | string | null | undefined,
  range: DataTableDateRangeValue,
): boolean {
  if (!range.from && !range.to) return true;
  if (value == null) return false;
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return false;
  if (range.from) {
    const start = parseLocalDateStart(range.from).getTime();
    if (t < start) return false;
  }
  if (range.to) {
    const end = parseLocalDateEnd(range.to).getTime();
    if (t > end) return false;
  }
  return true;
}

type ColumnFilterEntry = { id: string; value: unknown };

/** The values picked in one faceted filter; empty when none are. */
export function selectedFilterValues(
  filters: readonly ColumnFilterEntry[],
  columnId: string,
): string[] {
  const value = filters.find((filter) => filter.id === columnId)?.value;
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

/**
 * The picked values of one faceted filter that belong to `allowed` — for enum
 * columns, so a hand-edited URL can't send the server a value it rejects.
 */
export function selectedEnumFilterValues<T extends string>(
  filters: readonly ColumnFilterEntry[],
  columnId: string,
  allowed: readonly T[],
): T[] {
  return selectedFilterValues(filters, columnId).filter((value): value is T =>
    (allowed as readonly string[]).includes(value),
  );
}

/**
 * One date-range filter as UTC instants for the server (the day bounds are
 * the user's local midnight), or `undefined` when nothing is picked.
 */
export function dateRangeFilterBounds(
  filters: readonly ColumnFilterEntry[],
  columnId: string,
): DataTableDateRangeValue | undefined {
  const value = filters.find((filter) => filter.id === columnId)?.value;
  if (!isDateRangeValue(value)) return undefined;
  const bounds = dateRangeToWireBounds(value);
  return bounds.from || bounds.to ? bounds : undefined;
}
