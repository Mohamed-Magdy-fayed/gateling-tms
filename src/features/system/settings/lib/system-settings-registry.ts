import type { SettingsLabel } from "@/drizzle/schema";

/**
 * Every deployment-wide setting this system knows, keyed by the stable code
 * stored in `settings.code`. The row holds the value; this registry holds the
 * meaning — what it is for, whether it is a secret, and what may be edited —
 * so nothing outside this file has to interpret a bare code.
 *
 * Codes are zero-padded and never reused: a retired setting keeps its number
 * so an old row can never be misread as a new setting.
 */
export const SYSTEM_SETTING_CODE = {
  MEETINGS_API_URL: "00001",
  MEETINGS_API_KEY: "00002",
  MEETINGS_WEBHOOK_SECRET: "00003",
} as const;

export type SystemSettingCode =
  (typeof SYSTEM_SETTING_CODE)[keyof typeof SYSTEM_SETTING_CODE];

export const DEFAULT_MEETINGS_API_URL = "https://meetings.gateling.com";

export type SystemSettingDefinition = {
  code: SystemSettingCode;
  label: SettingsLabel;
  /** Which integration or policy the setting belongs to, for grouping in the UI. */
  group: "meetings";
  /**
   * Never returned to a browser once set — the list reports only whether a
   * value exists, and saving replaces it wholesale. API keys and webhook
   * secrets are credentials for another system; an admin who needs to see
   * one again rotates it there.
   */
  isSecret: boolean;
  /** The value a fresh deployment starts with; null means "unset". */
  seedValue: string | null;
  /** Extra validation beyond "non-empty text", run on save. */
  validateValue?: (value: string) => boolean;
};

/** https only, except a Meetings instance on this machine for local development. */
function isAllowedMeetingsApiUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return true;
    return (
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

export const SYSTEM_SETTINGS: readonly SystemSettingDefinition[] = [
  {
    code: SYSTEM_SETTING_CODE.MEETINGS_API_URL,
    label: "integration",
    group: "meetings",
    isSecret: false,
    seedValue: DEFAULT_MEETINGS_API_URL,
    validateValue: isAllowedMeetingsApiUrl,
  },
  {
    code: SYSTEM_SETTING_CODE.MEETINGS_API_KEY,
    label: "integration",
    group: "meetings",
    isSecret: true,
    seedValue: null,
  },
  {
    code: SYSTEM_SETTING_CODE.MEETINGS_WEBHOOK_SECRET,
    label: "integration",
    group: "meetings",
    isSecret: true,
    seedValue: null,
  },
];

export const SYSTEM_SETTING_CODES: readonly SystemSettingCode[] =
  SYSTEM_SETTINGS.map((definition) => definition.code);

export function isSystemSettingCode(code: string): code is SystemSettingCode {
  return (SYSTEM_SETTING_CODES as readonly string[]).includes(code);
}

export function getSystemSettingDefinition(
  code: SystemSettingCode,
): SystemSettingDefinition {
  const definition = SYSTEM_SETTINGS.find((entry) => entry.code === code);
  if (!definition) {
    throw new Error(`Unknown system setting code: ${code}`);
  }
  return definition;
}
