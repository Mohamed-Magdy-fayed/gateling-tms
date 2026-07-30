import { and, asc, eq, isNull } from "drizzle-orm";
import { CoursesTable } from "@/drizzle/schema";
import type { ExportRowLoader } from "@/features/core/import/server/export-registry";

/**
 * The organization's courses in the shape its import template accepts, so an
 * export can be edited and uploaded straight back. `id` is always present —
 * that is what makes the re-import an update rather than a duplicate.
 */
export const loadCourseExportRows: ExportRowLoader = async (
  db,
  organizationId,
) => {
  const courses = await db
    .select({
      id: CoursesTable.id,
      name: CoursesTable.name,
      description: CoursesTable.description,
    })
    .from(CoursesTable)
    .where(
      and(
        eq(CoursesTable.organizationId, organizationId),
        isNull(CoursesTable.deletedAt),
      ),
    )
    .orderBy(asc(CoursesTable.createdAt), asc(CoursesTable.id));

  return courses.map((course) => ({
    id: course.id,
    name: course.name,
    description: course.description ?? "",
  }));
};
