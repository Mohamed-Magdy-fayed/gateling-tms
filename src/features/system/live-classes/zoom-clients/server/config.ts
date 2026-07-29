import { baseUrl, env } from "@/data/env/server";
import type { ZoomCredentials } from "@/integrations/zoom";

/** Registered on the Zoom app as its OAuth redirect URL — must match exactly. */
export const ZOOM_CALLBACK_PATH = "/api/zoom/callback";

export class ZoomNotConfiguredError extends Error {
  constructor() {
    super("Zoom integration is not configured.");
  }
}

export type ZoomConfig = {
  credentials: ZoomCredentials;
  encryptionKey: string;
};

/**
 * Zoom is optional per phase-06.md step 3 — an org that never connects it
 * still schedules classes — so the credentials stay optional env vars and the
 * absence is reported at the point someone tries to connect, rather than
 * failing the whole app's boot the way the Inngest keys do (STATE.md D40).
 */
export function getZoomConfig(): ZoomConfig {
  if (
    !env.ZOOM_CLIENT_ID ||
    !env.ZOOM_CLIENT_SECRET ||
    !env.ZOOM_TOKEN_ENCRYPTION_KEY
  ) {
    throw new ZoomNotConfiguredError();
  }

  return {
    credentials: {
      clientId: env.ZOOM_CLIENT_ID,
      clientSecret: env.ZOOM_CLIENT_SECRET,
      redirectUri: new URL(ZOOM_CALLBACK_PATH, baseUrl).toString(),
    },
    encryptionKey: env.ZOOM_TOKEN_ENCRYPTION_KEY,
  };
}

export function isZoomConfigured(): boolean {
  return Boolean(
    env.ZOOM_CLIENT_ID &&
      env.ZOOM_CLIENT_SECRET &&
      env.ZOOM_TOKEN_ENCRYPTION_KEY,
  );
}
