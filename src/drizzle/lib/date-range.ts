import { type AnyColumn, and, gte, lte, type SQL } from "drizzle-orm";
import { z } from "zod";

/**
 * A list filter on a timestamp column: either bound may be absent. The client
 * sends instants (its local day boundaries already converted to UTC by
 * `dateRangeFilterBounds`), so the server compares them as-is.
 */
export const dateRangeInput = z
  .object({
    from: z.iso.datetime().optional(),
    to: z.iso.datetime().optional(),
  })
  .optional();

export type DateRangeInput = z.infer<typeof dateRangeInput>;

/** `column` within `range`, inclusive; `undefined` (no filter) when unset. */
export function inDateRange(
  column: AnyColumn,
  range: DateRangeInput,
): SQL | undefined {
  if (!range?.from && !range?.to) return undefined;
  return and(
    range.from ? gte(column, new Date(range.from)) : undefined,
    range.to ? lte(column, new Date(range.to)) : undefined,
  );
}
