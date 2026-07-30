import { baseUrl, env } from "@/data/env/server";
import type { GoogleCredentials } from "@/integrations/google";

/**
 * Registered on the Google Cloud OAuth client as an authorized redirect URI —
 * must match exactly. Separate from sign-in's `/api/oauth/google`: this
 * handshake grants an *organization* access to a Google account's forms, and
 * mixing the two would mean one callback deciding which of two very different
 * things it was completing (docs/integrations-google.md).
 */
export const GOOGLE_CALLBACK_PATH = "/api/google/callback";

export class GoogleNotConfiguredError extends Error {
  constructor() {
    super("Google integration is not configured.");
  }
}

export type GoogleImportConfig = {
  credentials: GoogleCredentials;
  encryptionKey: string;
};

/**
 * The Google Forms import is optional per phase-07.md — an org that never
 * connects it still builds assessments by hand — so the credentials stay
 * optional env vars and the absence is reported at the point someone tries to
 * connect, rather than failing the whole app's boot the way the Inngest keys
 * do (STATE.md D40). Same shape as zoom-clients/server/config.ts.
 *
 * `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are the same pair sign-in uses —
 * one Google Cloud project, two redirect URIs, one extra scope on the consent
 * screen.
 */
export function getGoogleImportConfig(): GoogleImportConfig {
  if (
    !env.GOOGLE_CLIENT_ID ||
    !env.GOOGLE_CLIENT_SECRET ||
    !env.GOOGLE_TOKEN_ENCRYPTION_KEY
  ) {
    throw new GoogleNotConfiguredError();
  }

  return {
    credentials: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectUri: new URL(GOOGLE_CALLBACK_PATH, baseUrl).toString(),
    },
    encryptionKey: env.GOOGLE_TOKEN_ENCRYPTION_KEY,
  };
}

export function isGoogleImportConfigured(): boolean {
  return Boolean(
    env.GOOGLE_CLIENT_ID &&
      env.GOOGLE_CLIENT_SECRET &&
      env.GOOGLE_TOKEN_ENCRYPTION_KEY,
  );
}
