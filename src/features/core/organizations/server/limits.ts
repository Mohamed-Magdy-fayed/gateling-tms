import { TRPCError } from "@trpc/server";
import type { Organization, OrganizationPlan } from "@/drizzle/schema";
import type { TRPCContext } from "@/integrations/trpc/init";

const BYTES_PER_GB = 1024 * 1024 * 1024;

/**
 * Values from `docs/rebuild/00-product-spec.md` §"Plan limits" (source:
 * SOURCE `pricing/data.ts`) — keep these two in sync if pricing changes.
 * `null` = unlimited (enterprise's student/course counts; storage is always
 * capped, even on enterprise).
 */
export const PLAN_LIMITS: Record<
  OrganizationPlan,
  { maxStudents: number | null; maxCourses: number | null; maxStorageBytes: number }
> = {
  free: { maxStudents: 50, maxCourses: 5, maxStorageBytes: 1 * BYTES_PER_GB },
  basic: { maxStudents: 200, maxCourses: 25, maxStorageBytes: 10 * BYTES_PER_GB },
  professional: {
    maxStudents: 1000,
    maxCourses: 100,
    maxStorageBytes: 50 * BYTES_PER_GB,
  },
  enterprise: {
    maxStudents: null,
    maxCourses: null,
    maxStorageBytes: 500 * BYTES_PER_GB,
  },
};

/**
 * Called from the write path of whichever domain phase adds students (Phase
 * 5) — not enforced anywhere yet in Phase 2, only defined and tested now per
 * `docs/rebuild/phases/phase-02.md` step 4 / AD-6.
 */
export function assertCanAddStudent(
  ctx: Pick<TRPCContext, "t">,
  organization: Pick<Organization, "plan" | "studentCount">,
  increment = 1,
) {
  const limit = PLAN_LIMITS[organization.plan].maxStudents;
  if (limit !== null && organization.studentCount + increment > limit) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: ctx.t("organizations.limits.studentLimitReached", { limit }),
    });
  }
}

export function assertCanAddCourse(
  ctx: Pick<TRPCContext, "t">,
  organization: Pick<Organization, "plan" | "courseCount">,
  increment = 1,
) {
  const limit = PLAN_LIMITS[organization.plan].maxCourses;
  if (limit !== null && organization.courseCount + increment > limit) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: ctx.t("organizations.limits.courseLimitReached", { limit }),
    });
  }
}

export function assertStorageBudget(
  ctx: Pick<TRPCContext, "t">,
  organization: Pick<Organization, "plan" | "storageBytes">,
  additionalBytes: number,
) {
  const limit = PLAN_LIMITS[organization.plan].maxStorageBytes;
  if (organization.storageBytes + additionalBytes > limit) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: ctx.t("organizations.limits.storageLimitReached", {
        limitGb: Math.round(limit / BYTES_PER_GB),
      }),
    });
  }
}
