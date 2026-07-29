import { traineeImportTemplate } from "@/features/system/learning-flow/trainees/server/import-template";
import type { ImportTemplate } from "../lib";

/**
 * Every entity that has a downloadable template, keyed by the slug in
 * `/api/import/templates/<entity>`. An aggregation point that imports from
 * feature folders, the same shape as `integrations/trpc/routers/_app.ts` —
 * deliberately not re-exported from this folder's barrel, so importing the
 * import framework never drags every entity's definition along with it.
 */
const IMPORT_TEMPLATES: Record<string, ImportTemplate> = {
  [traineeImportTemplate.entity]: traineeImportTemplate,
};

export function findImportTemplate(entity: string): ImportTemplate | undefined {
  return IMPORT_TEMPLATES[entity];
}
