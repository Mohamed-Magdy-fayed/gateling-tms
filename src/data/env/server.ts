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

    // Used to build absolute links (email verification, OAuth redirect).
    // Optional here so dev/build never needs them set — defaulted to
    // localhost via `baseUrl`/`oauthRedirectUrlBase` below, but required in
    // production (see the fail-closed check) so a deploy can't silently
    // email out a localhost verification link or redirect OAuth there.
    BASE_URL: z.url().optional(),
    OAUTH_REDIRECT_URL_BASE: z.url().optional(),

    // Dormant until Mohamed provides Google OAuth credentials (Phase 2).
    // The same pair also authorizes the per-organization Google Forms grant
    // (Phase 7) — one Cloud project, two redirect URIs, one extra scope.
    // GOOGLE_TOKEN_ENCRYPTION_KEY is 32 random bytes, base64-encoded
    // (`openssl rand -base64 32`); it encrypts those per-org OAuth tokens at
    // rest, and is separate from the onMeeting key so rotating one provider's key
    // never touches the other's stored tokens — see docs/integrations-google.md.
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    // Validated here rather than only where it is used: a mistyped key would
    // otherwise report Google as configured, offer the Connect button, and
    // fail after the admin had already approved the grant on Google's side.
    GOOGLE_TOKEN_ENCRYPTION_KEY: z
      .string()
      .refine((value) => Buffer.from(value, "base64").length === 32, {
        error: "GOOGLE_TOKEN_ENCRYPTION_KEY must be 32 base64-encoded bytes.",
      })
      .optional(),

    // Dormant until Mohamed provides SMTP credentials (Phase 2) — sendMail
    // logs a warning and no-ops instead of throwing when unset (dev-safe).
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASSWORD: z.string().min(1).optional(),
    SMTP_FROM_EMAIL: z.email().optional(),
    SMTP_FROM_NAME: z.string().min(1).optional(),

    // onMeeting (Phase 6, D142) — the only deployment-level value the
    // integration needs. There is no app id, client secret or webhook token:
    // credentials belong to each organization and are obtained in-app by
    // signing in to onMeeting once (D146). This key encrypts the API
    // key/secret pair that exchange returns, at rest.
    // 32 random bytes, base64-encoded (`openssl rand -base64 32`), different
    // per environment — see docs/integrations-onmeeting.md.
    // Validated here for the same reason as the Google key: a mistyped value
    // would otherwise report onMeeting as configured and offer a Connect form
    // that can only fail after the admin has typed their password into it.
    ONMEETING_CREDENTIALS_ENCRYPTION_KEY: z
      .string()
      .refine((value) => Buffer.from(value, "base64").length === 32, {
        error:
          "ONMEETING_CREDENTIALS_ENCRYPTION_KEY must be 32 base64-encoded bytes.",
      })
      .optional(),

    // Grades short-answer questions whose text doesn't match an accepted
    // answer outright — see integrations/gemini. Optional on purpose: with no
    // key the grader still awards exact/normalised matches and leaves anything
    // ambiguous for manual review, so assessments keep working unconfigured.
    // This is an AI Studio key and is unrelated to GOOGLE_CLIENT_ID/SECRET
    // above, which are OAuth credentials for the Forms import.
    GEMINI_API_KEY: z.string().min(1).optional(),
    // Overridable so the model can be bumped without a code change.
    GEMINI_MODEL: z.string().min(1).optional(),

    // Where /contact form submissions are emailed. Falls back to
    // SMTP_FROM_EMAIL/SMTP_USER if unset — see
    // integrations/inngest/functions/on-contact-message-submitted.ts.
    CONTACT_INBOX_EMAIL: z.email().optional(),

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

// Fail closed: with `emptyStringAsUndefined`, a blank BASE_URL/
// OAUTH_REDIRECT_URL_BASE in a deployed environment would silently fall back
// to localhost — emailing out an unusable verification link, or sending
// Google's OAuth redirect to a localhost URL, instead of failing the build.
if (
  env.NODE_ENV === "production" &&
  (!env.BASE_URL || !env.OAUTH_REDIRECT_URL_BASE)
) {
  throw new Error(
    "BASE_URL and OAUTH_REDIRECT_URL_BASE are required in production.",
  );
}

// Local/dev-only fallbacks — never reached in production, see the check above.
export const baseUrl = env.BASE_URL ?? "http://localhost:3000";
export const oauthRedirectUrlBase =
  env.OAUTH_REDIRECT_URL_BASE ?? "http://localhost:3000/api/oauth";
