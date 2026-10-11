/**
 * Whether the showcase seed may write to this database. Fail-closed: on Vercel
 * it runs only for a Preview deployment — Production, Development, or a
 * missing/unknown VERCEL_ENV all skip. Off Vercel (a local Docker database) it
 * runs, unless the environment claims to be production.
 *
 * Kept free of imports so the CLI can decide before anything loads the
 * database or validates the env.
 */
export function showcaseSeedDecision(env: Record<string, string | undefined>): {
  allowed: boolean;
  reason: string;
} {
  if (
    env.VERCEL_ENV === "production" ||
    env.VERCEL_TARGET_ENV === "production"
  ) {
    return { allowed: false, reason: "this is a production build" };
  }
  if (env.VERCEL) {
    return env.VERCEL_ENV === "preview"
      ? { allowed: true, reason: "Vercel preview build" }
      : {
          allowed: false,
          reason: `Vercel build with VERCEL_ENV=${env.VERCEL_ENV ?? "(unset)"}, not preview`,
        };
  }
  return { allowed: true, reason: "local run, not on Vercel" };
}
