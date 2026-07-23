export const SEED_SYSTEM_ACTOR = "system:seed";

// Shared by every seeded account below — a dev-only convenience (documented
// in README.md's "Seeded accounts" section), not a security boundary.
// Satisfies passwordSchema (8+ chars, upper+lower+number).
export const SEED_DEFAULT_PASSWORD = "DevPass123!";

export const SEED_ADMIN_EMAIL = "admin@gateling-tms.dev";
export const SEED_ADMIN_ID = "00000000-0000-0000-0000-000000000001";

export const SEED_TEACHER_EMAIL = "teacher@gateling-tms.dev";
export const SEED_TEACHER_ID = "00000000-0000-0000-0000-000000000002";

export const SEED_STUDENT_1_EMAIL = "student1@gateling-tms.dev";
export const SEED_STUDENT_1_ID = "00000000-0000-0000-0000-000000000003";

export const SEED_STUDENT_2_EMAIL = "student2@gateling-tms.dev";
export const SEED_STUDENT_2_ID = "00000000-0000-0000-0000-000000000004";

export const SEED_ORG_ID = "00000000-0000-0000-0000-0000000000a1";
export const SEED_ORG_SHORT_CODE = "DEV1";
export const SEED_ORG_NAME = "Gateling-TMS Dev Academy";

export const SEED_PROFILE_NAMES = ["baseline"] as const;
export type SeedProfileName = (typeof SEED_PROFILE_NAMES)[number];

export const DEFAULT_SEED_PROFILE: SeedProfileName = "baseline";
