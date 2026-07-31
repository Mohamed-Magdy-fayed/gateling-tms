import { env } from "@/data/env/server";

export class OnMeetingNotConfiguredError extends Error {
  constructor() {
    super("onMeeting integration is not configured.");
  }
}

/**
 * onMeeting is optional (phase-06.md step 4) — an org that never connects it
 * still schedules classes — so the key stays an optional env var and its
 * absence is reported when someone tries to connect, rather than failing the
 * whole app's boot the way the Inngest keys do (STATE.md D40).
 *
 * Unlike Zoom there is no client id or secret to resolve: the only
 * deployment-level value is the key that encrypts each org's own API
 * credentials at rest (D146).
 */
export function getCredentialsEncryptionKey(): string {
  if (!env.ONMEETING_CREDENTIALS_ENCRYPTION_KEY) {
    throw new OnMeetingNotConfiguredError();
  }

  return env.ONMEETING_CREDENTIALS_ENCRYPTION_KEY;
}

export function isOnMeetingConfigured(): boolean {
  return Boolean(env.ONMEETING_CREDENTIALS_ENCRYPTION_KEY);
}
