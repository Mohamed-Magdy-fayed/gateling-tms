import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import type { db as database, Transaction } from "@/drizzle";
import { CoursesTable } from "@/drizzle/schema";
import { courseNameKey } from "./import-resolution";

/** Reads run either on the request connection or inside a commit's transaction. */
export type Reader = typeof database | Transaction;

/**
 * Course lookups shared by the courses import (which matches a row to a course
 * by either key) and the levels import (which only ever names a parent course
 * by name). Soft-deleted courses are excluded everywhere: an import must not
 * quietly attach to, or resurrect, an archived course.
 */

export async function findCourseIdsById(
  reader: Reader,
  organizationId: string,
  ids: string[],
): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  if (ids.length === 0) return found;

  const matches = await reader
    .select({ id: CoursesTable.id })
    .from(CoursesTable)
    .where(
      and(
        eq(CoursesTable.organizationId, organizationId),
        isNull(CoursesTable.deletedAt),
        inArray(CoursesTable.id, ids),
      ),
    );

  for (const course of matches) found.set(course.id, course.id);
  return found;
}

/**
 * Keyed by `courseNameKey`, so matching is case-insensitive. Nothing stops two
 * courses sharing a name, so the lowest id wins rather than letting row order
 * decide which one a re-import updates.
 */
export async function findCourseIdsByName(
  reader: Reader,
  organizationId: string,
  nameKeys: string[],
): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  if (nameKeys.length === 0) return found;

  const matches = await reader
    .select({ id: CoursesTable.id, name: CoursesTable.name })
    .from(CoursesTable)
    .where(
      and(
        eq(CoursesTable.organizationId, organizationId),
        isNull(CoursesTable.deletedAt),
        inArray(sql`lower(${CoursesTable.name})`, nameKeys),
      ),
    )
    .orderBy(CoursesTable.id);

  for (const course of matches) {
    const key = courseNameKey(course.name);
    if (!found.has(key)) found.set(key, course.id);
  }

  return found;
}
