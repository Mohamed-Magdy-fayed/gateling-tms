import {
  DEFAULT_SEED_PROFILE,
  SEED_ADMIN_EMAIL,
  SEED_ADMIN_ID,
  SEED_ORG_ID,
  SEED_SYSTEM_ACTOR,
  type SeedProfileName,
} from "./constants";
import { seedBaselineProfile } from "./profiles/baseline";

const profileRunners: Record<
  SeedProfileName,
  () => Promise<{ profile: SeedProfileName }>
> = {
  baseline: seedBaselineProfile,
};

export {
  DEFAULT_SEED_PROFILE,
  SEED_ADMIN_EMAIL,
  SEED_ADMIN_ID,
  SEED_ORG_ID,
  SEED_SYSTEM_ACTOR,
  type SeedProfileName,
};

export async function runSeedProfile(
  profile: SeedProfileName = DEFAULT_SEED_PROFILE,
) {
  const result = await profileRunners[profile]();
  console.info('Seed completed (profile: "%s").', result.profile);
  return result;
}
