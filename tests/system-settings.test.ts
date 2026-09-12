import { describe, expect, test } from "vitest";
import {
  DEFAULT_MEETINGS_API_URL,
  getSystemSettingDefinition,
  isSystemSettingCode,
  SYSTEM_SETTING_CODE,
  SYSTEM_SETTING_CODES,
  SYSTEM_SETTINGS,
} from "../src/features/system/settings/lib/system-settings-registry";
import { updateSystemSettingSchema } from "../src/features/system/settings/server/schemas";

/**
 * The registry is the contract between the settings table and the code that
 * reads it: a code that drifts, a secret that stops being one, or a URL rule
 * that loosens would each surface as a live-classes outage rather than a
 * type error.
 */
describe("system settings registry", () => {
  test("every code is registered exactly once", () => {
    expect(new Set(SYSTEM_SETTING_CODES).size).toBe(SYSTEM_SETTINGS.length);
    for (const code of Object.values(SYSTEM_SETTING_CODE)) {
      expect(isSystemSettingCode(code)).toBe(true);
    }
  });

  test("an unknown code is refused, not guessed", () => {
    expect(isSystemSettingCode("99999")).toBe(false);
    expect(isSystemSettingCode("")).toBe(false);
  });

  test("the Meetings credentials are secrets; the URL is not", () => {
    expect(
      getSystemSettingDefinition(SYSTEM_SETTING_CODE.MEETINGS_API_KEY).isSecret,
    ).toBe(true);
    expect(
      getSystemSettingDefinition(SYSTEM_SETTING_CODE.MEETINGS_WEBHOOK_SECRET)
        .isSecret,
    ).toBe(true);
    expect(
      getSystemSettingDefinition(SYSTEM_SETTING_CODE.MEETINGS_API_URL).isSecret,
    ).toBe(false);
  });

  test("a fresh deployment points at the hosted Meetings, with no key", () => {
    expect(
      getSystemSettingDefinition(SYSTEM_SETTING_CODE.MEETINGS_API_URL)
        .seedValue,
    ).toBe(DEFAULT_MEETINGS_API_URL);
    expect(
      getSystemSettingDefinition(SYSTEM_SETTING_CODE.MEETINGS_API_KEY)
        .seedValue,
    ).toBeNull();
  });

  // The API key travels in a header to whatever this URL says, so a
  // plaintext host — other than the developer's own machine — must never be
  // accepted.
  test("the Meetings URL must be https, except on localhost", () => {
    const validate = getSystemSettingDefinition(
      SYSTEM_SETTING_CODE.MEETINGS_API_URL,
    ).validateValue;
    if (!validate) throw new Error("expected a URL validator");

    expect(validate("https://meetings.gateling.com")).toBe(true);
    expect(validate("http://localhost:3001")).toBe(true);
    expect(validate("http://meetings.gateling.com")).toBe(false);
    expect(validate("not a url")).toBe(false);
  });
});

describe("updateSystemSettingSchema", () => {
  test("accepts a registered code with a value", () => {
    expect(
      updateSystemSettingSchema.safeParse({
        code: SYSTEM_SETTING_CODE.MEETINGS_API_KEY,
        value: "gm_live_abc",
      }).success,
    ).toBe(true);
  });

  test("an empty value is allowed — it clears the setting", () => {
    expect(
      updateSystemSettingSchema.safeParse({
        code: SYSTEM_SETTING_CODE.MEETINGS_API_KEY,
        value: "   ",
      }).success,
    ).toBe(true);
  });

  test("refuses a code that isn't in the registry", () => {
    expect(
      updateSystemSettingSchema.safeParse({ code: "99999", value: "x" })
        .success,
    ).toBe(false);
  });
});
