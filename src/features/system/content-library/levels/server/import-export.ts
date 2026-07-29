import { and, asc, eq, isNull } from "drizzle-orm";
import { CoursesTable, LevelsTable } from "@/drizzle/schema";
import type { ExportRowLoader } from "@/features/core/import/server/export-registry";

/**
 * Every level under the organization's active courses, named the way the
 * levels template names them — by their course's name rather than its id, so
 * the file reads the same as one typed by hand.
 */
export const loadLevelExportRows: ExportRowLoader = async (
  db,
  organizationId,
) => {
  const levels = await db
    .select({
      id: LevelsTable.id,
      courseName: CoursesTable.name,
      name: LevelsTable.name,
      order: LevelsTable.order,
    })
    .from(LevelsTable)
    .innerJoin(
      CoursesTable,
      and(
        eq(LevelsTable.courseId, CoursesTable.id),
        eq(CoursesTable.organizationId, organizationId),
        isNull(CoursesTable.deletedAt),
      ),
    )
    .where(eq(LevelsTable.organizationId, organizationId))
    .orderBy(
      asc(CoursesTable.name),
      asc(LevelsTable.order),
      asc(LevelsTable.id),
    );

  return levels.map((level) => ({
    id: level.id,
    courseName: level.courseName,
    name: level.name,
    order: String(level.order),
  }));
};
