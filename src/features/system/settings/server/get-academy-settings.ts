import "server-only";
import { cache } from "react";
import { db } from "@/drizzle";
import { readAcademySettings } from "./academy-queries";

/**
 * `readAcademySettings` memoized for one Server Component render, so a page
 * whose components each ask for the academy's preferences pays one query.
 * Server Components only: `cache()` memoizes nothing in a tRPC handler or an
 * Inngest job, which call `readAcademySettings(db, organizationId)` directly
 * (design doc `academy-preferences.md` R2).
 */
export const getAcademySettings = cache(async (organizationId: string) =>
  readAcademySettings(db, organizationId),
);
