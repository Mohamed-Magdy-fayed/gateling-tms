import { and, asc, eq, isNull } from "drizzle-orm";
import { CoursesTable, EnrollmentsTable, TraineesTable } from "@/drizzle/schema";
import type { ExportRowLoader } from "@/features/core/import/server/export-registry";

/**
 * The organization's enrollments in the shape its import template accepts.
 * Both the trainee's email and name are written even though the importer only
 * needs one: the email is what a re-import matches on, and the name is what
 * makes the file readable to whoever edits it.
 */
export const loadEnrollmentExportRows: ExportRowLoader = async (
  db,
  organizationId,
) => {
  const enrollments = await db
    .select({
      id: EnrollmentsTable.id,
      traineeEmail: TraineesTable.email,
      traineeName: TraineesTable.name,
      courseName: CoursesTable.name,
      status: EnrollmentsTable.status,
    })
    .from(EnrollmentsTable)
    .innerJoin(
      TraineesTable,
      and(
        eq(EnrollmentsTable.traineeId, TraineesTable.id),
        isNull(TraineesTable.deletedAt),
      ),
    )
    .innerJoin(
      CoursesTable,
      and(
        eq(EnrollmentsTable.courseId, CoursesTable.id),
        isNull(CoursesTable.deletedAt),
      ),
    )
    .where(eq(EnrollmentsTable.organizationId, organizationId))
    .orderBy(asc(EnrollmentsTable.createdAt), asc(EnrollmentsTable.id));

  return enrollments.map((enrollment) => ({
    id: enrollment.id,
    traineeEmail: enrollment.traineeEmail ?? "",
    traineeName: enrollment.traineeName,
    courseName: enrollment.courseName,
    status: enrollment.status,
  }));
};
