import "server-only";

import type { Database } from "@/drizzle";
import { SYSTEM_SETTING_CODE } from "@/features/system/settings/lib/system-settings-registry";
import { readSystemSettingValues } from "@/features/system/settings/server/queries";
import {
  createMeetingsClient,
  type MeetingsClient,
} from "@/integrations/meetings";

/**
 * The Gateling Meetings integration as configured in this deployment's
 * settings table — not the environment. An admin creates the integration on
 * Meetings' side, pastes the API key and webhook secret into the settings
 * page, and live classes turn on for every academy; nothing to redeploy.
 *
 * Read per call rather than cached: the settings row is one indexed lookup,
 * and a key an admin just rotated must take effect on the next click, not
 * after a restart.
 */
export type MeetingsConfig = {
  apiUrl: string;
  apiKey: string;
  webhookSecret: string | null;
};

const CONFIG_CODES = [
  SYSTEM_SETTING_CODE.MEETINGS_API_URL,
  SYSTEM_SETTING_CODE.MEETINGS_API_KEY,
  SYSTEM_SETTING_CODE.MEETINGS_WEBHOOK_SECRET,
] as const;

/**
 * Null until both the URL and the key are set — never a half-configuration.
 * The webhook secret is reported separately: without it classes still start,
 * and the receiver answers 503 so Meetings keeps retrying (§5 of
 * docs/integrations-meetings.md) instead of the event being lost.
 */
export async function resolveMeetingsConfig(
  db: Database,
): Promise<MeetingsConfig | null> {
  const values = await readSystemSettingValues(db, CONFIG_CODES);
  const apiUrl = values.get(SYSTEM_SETTING_CODE.MEETINGS_API_URL);
  const apiKey = values.get(SYSTEM_SETTING_CODE.MEETINGS_API_KEY);
  if (!apiUrl || !apiKey) return null;

  return {
    apiUrl,
    apiKey,
    webhookSecret:
      values.get(SYSTEM_SETTING_CODE.MEETINGS_WEBHOOK_SECRET) ?? null,
  };
}

let cached: { key: string; client: MeetingsClient } | null = null;

/**
 * A client for the current settings, or null when live classes aren't set
 * up. Memoised per URL+key so the (cheap) client isn't rebuilt per request
 * while a rotated key still produces a fresh one.
 */
export async function resolveMeetingsClient(
  db: Database,
): Promise<MeetingsClient | null> {
  const config = await resolveMeetingsConfig(db);
  if (!config) return null;

  const key = `${config.apiUrl}|${config.apiKey}`;
  if (cached?.key !== key) {
    cached = {
      key,
      client: createMeetingsClient({
        baseUrl: config.apiUrl,
        apiKey: config.apiKey,
      }),
    };
  }
  return cached.client;
}

/** Whether "Start class" can be offered at all on this deployment. */
export async function isLiveClassesEnabled(db: Database): Promise<boolean> {
  return (await resolveMeetingsConfig(db)) !== null;
}

/** The secret the webhook receiver verifies deliveries against, if any. */
export async function resolveMeetingsWebhookSecret(
  db: Database,
): Promise<string | undefined> {
  const values = await readSystemSettingValues(db, [
    SYSTEM_SETTING_CODE.MEETINGS_WEBHOOK_SECRET,
  ]);
  return values.get(SYSTEM_SETTING_CODE.MEETINGS_WEBHOOK_SECRET) ?? undefined;
}
