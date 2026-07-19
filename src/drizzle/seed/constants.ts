export const SEED_SYSTEM_ACTOR = "system:seed";

export const SEED_ADMIN_EMAIL = "admin@gateling-tms.dev";
export const SEED_ADMIN_ID = "00000000-0000-0000-0000-000000000001";

export const SEED_ORG_ID = "00000000-0000-0000-0000-0000000000a1";
export const SEED_ORG_SHORT_CODE = "DEV1";
export const SEED_ORG_NAME = "Gateling-TMS Dev Academy";

export const SEED_PROFILE_NAMES = ["baseline"] as const;
export type SeedProfileName = (typeof SEED_PROFILE_NAMES)[number];

export const DEFAULT_SEED_PROFILE: SeedProfileName = "baseline";
