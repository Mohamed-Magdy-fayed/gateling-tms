import { and, count, eq, isNull } from "drizzle-orm";
import type { db, Transaction } from "@/drizzle";
import { CoursesTable, TraineesTable } from "@/drizzle/schema";

/** Reads run either on the request connection or inside a transaction. */
type Reader = typeof db | Transaction;

/**
 * The maintained counters the plan limits are enforced against. The type is
 * derived from this list, not declared beside it, so a counter can never be
 * added to one and forgotten in the comparison below.
 */
export const USAGE_COUNTERS = [
  "studentCount",
  "courseCount",
  "storageBytes",
] as const;

export type UsageCounterName = (typeof USAGE_COUNTERS)[number];

export type StoredUsage = Record<UsageCounterName, number>;

/**
 * A measured value per counter. `null` means "not measured on this run" —
 * storage lives in Firebase, which is skipped when the bucket isn't
 * configured or when it moved underneath the measurement (see
 * `on-usage-reconciliation-requested.ts`).
 */
export type MeasuredUsage = Partial<Record<UsageCounterName, number | null>>;

export type UsageDiscrepancy = {
  counter: UsageCounterName;
  stored: number;
  actual: number;
};

/**
 * What the counters *should* say, counted from the rows themselves.
 *
 * Uses the same `deletedAt is null` predicate the list queries and the limit
 * checks use — a soft-deleted trainee is already decremented from
 * `studentCount` by `deleteTrainee`, so counting it here would make every
 * reconciliation "correct" the counter straight back up.
 */
export async function countOrganizationUsage(
  reader: Reader,
  organizationId: string,
): Promise<{ studentCount: number; courseCount: number }> {
  // Sequential rather than Promise.all: inside a transaction these run on one
  // connection, which can't serve two queries at once.
  const [{ value: studentCount }] = await reader
    .select({ value: count() })
    .from(TraineesTable)
    .where(
      and(
        eq(TraineesTable.organizationId, organizationId),
        isNull(TraineesTable.deletedAt),
      ),
    );

  const [{ value: courseCount }] = await reader
    .select({ value: count() })
    .from(CoursesTable)
    .where(
      and(
        eq(CoursesTable.organizationId, organizationId),
        isNull(CoursesTable.deletedAt),
      ),
    );

  return {
    studentCount: Number(studentCount),
    courseCount: Number(courseCount),
  };
}

/**
 * Which counters drifted, and by how much. Pure — the caller decides what to
 * write and what to log.
 *
 * A counter the run didn't measure (`null` or absent) is left alone rather
 * than treated as zero: an unmeasured counter is unknown, not empty, and
 * writing zero would wipe a real usage figure.
 */
export function computeUsageDrift(
  stored: StoredUsage,
  measured: MeasuredUsage,
): UsageDiscrepancy[] {
  const discrepancies: UsageDiscrepancy[] = [];

  for (const counter of USAGE_COUNTERS) {
    const actual = measured[counter];
    if (actual == null || !Number.isFinite(actual)) continue;
    if (actual === stored[counter]) continue;

    discrepancies.push({ counter, stored: stored[counter], actual });
  }

  return discrepancies;
}

/** The `set` payload for a drift correction, keyed by counter name. */
export function toUsageCorrection(
  discrepancies: UsageDiscrepancy[],
): Partial<StoredUsage> {
  return Object.fromEntries(
    discrepancies.map(({ counter, actual }) => [counter, actual]),
  );
}
