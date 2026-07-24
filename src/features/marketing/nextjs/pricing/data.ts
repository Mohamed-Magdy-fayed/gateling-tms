import {
  type OrganizationPlan,
  organizationPlanValues,
} from "@/drizzle/schema";

/**
 * Values from `docs/rebuild/00-product-spec.md` §"Plan limits" (source:
 * SOURCE `pricing/data.ts`). Student/course/storage limits live in
 * `@/features/core/organizations/server/limits` (the enforcement source of
 * truth, built in Phase 2) — this file only adds the marketing-facing
 * metadata (price, module access, popular badge) that doesn't exist there.
 */
export const PLAN_ORDER = organizationPlanValues;

export const PLAN_MONTHLY_PRICE_EGP: Record<OrganizationPlan, number> = {
  free: 0,
  basic: 599.99,
  professional: 1599,
  enterprise: 3999,
};

export const POPULAR_PLAN: OrganizationPlan = "professional";

export const featureModuleKeys = [
  "contentLibrary",
  "learningFlow",
  "liveClasses",
  "hr",
  "courseStore",
  "crm",
  "smartForms",
  "community",
  "support",
] as const;
export type FeatureModuleKey = (typeof featureModuleKeys)[number];

const PLAN_MODULE_ACCESS: Record<
  OrganizationPlan,
  readonly FeatureModuleKey[]
> = {
  free: ["contentLibrary", "learningFlow", "liveClasses"],
  basic: ["contentLibrary", "learningFlow", "liveClasses", "hr", "courseStore"],
  professional: [
    "contentLibrary",
    "learningFlow",
    "liveClasses",
    "hr",
    "courseStore",
    "crm",
    "smartForms",
  ],
  enterprise: featureModuleKeys,
};

export function planIncludesModule(
  plan: OrganizationPlan,
  moduleKey: FeatureModuleKey,
): boolean {
  return PLAN_MODULE_ACCESS[plan].includes(moduleKey);
}
