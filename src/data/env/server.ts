import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),

    // Dormant until Phase 2 (sessions/ratelimit) — optional so local dev/build
    // doesn't require credentials before anything actually calls redisClient.
    REDIS_URL: z.string().min(1).optional(),
    REDIS_TOKEN: z.string().min(1).optional(),

    // Dormant until Phase 4 (media upload) — same reasoning.
    FIREBASE_PROJECT_ID: z.string().min(1).optional(),
    FIREBASE_CLIENT_EMAIL: z.string().min(1).optional(),
    FIREBASE_PRIVATE_KEY: z.string().min(1).optional(),
    FIREBASE_STORAGE_BUCKET: z.string().min(1).optional(),

    // inngest-cli dev works keyless locally; prod needs both (Phase 1 close-out).
    INNGEST_SIGNING_KEY: z.string().min(1).optional(),
    INNGEST_EVENT_KEY: z.string().min(1).optional(),

    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },
  experimental__runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

// Fail closed: INNGEST_DEV=1 disables Inngest's request signature
// verification. That's fine for local dev (see .env.example) but must never
// reach a deployed environment un-keyed, or the /api/inngest endpoint is
// unprotected. Both keys are `.optional()` above only so local dev/build
// doesn't require them before Phase 1 close-out actually sets them in Vercel.
if (
  env.NODE_ENV === "production" &&
  (!env.INNGEST_SIGNING_KEY || !env.INNGEST_EVENT_KEY)
) {
  throw new Error(
    "INNGEST_SIGNING_KEY and INNGEST_EVENT_KEY are required in production.",
  );
}
