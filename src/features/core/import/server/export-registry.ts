import type { db as database } from "@/drizzle";
import { loadCourseExportRows } from "@/features/system/content-library/courses/server/import-export";
import { courseImportTemplate } from "@/features/system/content-library/courses/server/import-template";
import { loadLevelExportRows } from "@/features/system/content-library/levels/server/import-export";
import { levelImportTemplate } from "@/features/system/content-library/levels/server/import-template";
import { loadEnrollmentExportRows } from "@/features/system/learning-flow/enrollments/server/import-export";
import { enrollmentImportTemplate } from "@/features/system/learning-flow/enrollments/server/import-template";
import { loadGroupStudentExportRows } from "@/features/system/learning-flow/groups/server/import-export";
import { groupStudentImportTemplate } from "@/features/system/learning-flow/groups/server/import-template";
import { loadTraineeExportRows } from "@/features/system/learning-flow/trainees/server/import-export";
import { traineeImportTemplate } from "@/features/system/learning-flow/trainees/server/import-template";

/**
 * Produces the organization's own rows keyed by the entity template's own
 * column keys, so the export and the importer can't disagree about shape.
 */
export type ExportRowLoader = (
  db: typeof database,
  organizationId: string,
) => Promise<Record<string, string>[]>;

/**
 * Every entity whose data can be exported in its import template's shape,
 * keyed by the same slug `/api/import/templates/<entity>` uses (STATE.md
 * D118). Kept apart from `registry.ts` so downloading a blank template never
 * drags the database queries along with it, and deliberately not re-exported
 * from this folder's barrel for the same reason.
 */
const EXPORT_LOADERS: Record<string, ExportRowLoader> = {
  [traineeImportTemplate.entity]: loadTraineeExportRows,
  [courseImportTemplate.entity]: loadCourseExportRows,
  [levelImportTemplate.entity]: loadLevelExportRows,
  [enrollmentImportTemplate.entity]: loadEnrollmentExportRows,
  [groupStudentImportTemplate.entity]: loadGroupStudentExportRows,
};

export function findExportRowLoader(
  entity: string,
): ExportRowLoader | undefined {
  return EXPORT_LOADERS[entity];
}
