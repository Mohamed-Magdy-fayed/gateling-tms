import { eq, inArray } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import { db } from "@/drizzle";
import { SettingsTable } from "@/drizzle/schema";
import {
  SYSTEM_SETTING_CODE,
  SYSTEM_SETTING_CODES,
} from "@/features/system/settings/lib/system-settings-registry";
import { readSystemSettingValues } from "@/features/system/settings/server";
import {
  createMember,
  createTenant,
  destroyMember,
  destroyTenant,
  errorCodeOf,
  flagPlatformOwner,
  type TenantFixture,
} from "./lib/harness";

/**
 * The regression contract for the deployment-wide settings routes (design
 * doc `docs/designs/academy-preferences.md`, R6), pinned before the router
 * and page are extended. These rows hold the Meetings URL, API key and
 * webhook secret that every live class depends on, so each preserved
 * behavior here is one a refactor must not quietly lose: a secret echoed
 * back, a blank that stops meaning "disconnect", a plaintext URL accepted.
 *
 * The `settings` table has no `organizationId` — these are the deployment's
 * values, shared by every tenant and every test file. Each test restores the
 * rows it touched, and the suite puts back the snapshot it started from.
 *
 * The gate is R1's: only a user flagged `isPlatformOwner`, whatever their org
 * role. Every behavior test runs as that owner; the gate tests prove an org
 * admin who is not the owner, and a teacher, are refused.
 */

const { MEETINGS_API_URL, MEETINGS_API_KEY, MEETINGS_WEBHOOK_SECRET } =
  SYSTEM_SETTING_CODE;

type SettingSnapshot = typeof SettingsTable.$inferSelect;

async function snapshotSettings(): Promise<SettingSnapshot[]> {
  return db
    .select()
    .from(SettingsTable)
    .where(inArray(SettingsTable.code, [...SYSTEM_SETTING_CODES]));
}

/** Puts every registered row back exactly as the snapshot had it. */
async function restoreSettings(snapshot: SettingSnapshot[]) {
  for (const row of snapshot) {
    await db
      .insert(SettingsTable)
      .values(row)
      .onConflictDoUpdate({
        target: SettingsTable.code,
        set: {
          value: row.value,
          updatedBy: row.updatedBy,
          updatedAt: row.updatedAt,
        },
      });
  }
}

async function storedValue(code: string): Promise<string | null | undefined> {
  const [row] = await db
    .select({ value: SettingsTable.value })
    .from(SettingsTable)
    .where(eq(SettingsTable.code, code));
  return row ? row.value : undefined;
}

async function setStoredValue(code: string, value: string | null) {
  await db
    .update(SettingsTable)
    .set({ value })
    .where(eq(SettingsTable.code, code));
}

describe("system settings routes", () => {
  let owner: TenantFixture;
  let admin: Awaited<ReturnType<typeof createMember>>;
  let teacher: Awaited<ReturnType<typeof createMember>>;
  let original: SettingSnapshot[];

  beforeAll(async () => {
    original = await snapshotSettings();
    // The seed rows come from the 0024 data migration; without them every
    // update below would report NOT_FOUND for the wrong reason.
    expect(original.map((row) => row.code).sort()).toEqual(
      [...SYSTEM_SETTING_CODES].sort(),
    );

    owner = await createTenant(
      `SS${Date.now().toString().slice(-6)}`,
      "System Settings",
    );
    await flagPlatformOwner(owner.userId);
    admin = await createMember(owner, "admin");
    teacher = await createMember(owner, "teacher");
  });

  afterEach(async () => {
    await restoreSettings(original);
  });

  afterAll(async () => {
    await restoreSettings(original);
    await destroyTenant(owner);
    await destroyMember(admin.userId);
    await destroyMember(teacher.userId);
  });

  describe("list", () => {
    test("returns every registered setting in registry order", async () => {
      const rows = await owner.caller.settings.list();

      expect(rows.map((row) => row.code)).toEqual([...SYSTEM_SETTING_CODES]);
    });

    test("shows a plain value but never echoes a secret that is set", async () => {
      await setStoredValue(MEETINGS_API_URL, "https://meetings.example.com");
      await setStoredValue(MEETINGS_API_KEY, "sk-live-should-never-leak");
      await setStoredValue(MEETINGS_WEBHOOK_SECRET, null);

      const rows = await owner.caller.settings.list();
      const byCode = new Map(rows.map((row) => [row.code, row]));

      expect(byCode.get(MEETINGS_API_URL)).toMatchObject({
        isSecret: false,
        value: "https://meetings.example.com",
        hasValue: true,
      });
      expect(byCode.get(MEETINGS_API_KEY)).toMatchObject({
        isSecret: true,
        value: null,
        hasValue: true,
      });
      expect(byCode.get(MEETINGS_WEBHOOK_SECRET)).toMatchObject({
        isSecret: true,
        value: null,
        hasValue: false,
      });
      expect(JSON.stringify(rows)).not.toContain("sk-live-should-never-leak");
    });

    test("reports a whitespace-only value as unset", async () => {
      await setStoredValue(MEETINGS_API_URL, "   ");

      const rows = await owner.caller.settings.list();
      const url = rows.find((row) => row.code === MEETINGS_API_URL);

      expect(url).toMatchObject({ value: null, hasValue: false });
    });
  });

  describe("update", () => {
    test("trims the value it stores and records who saved it", async () => {
      const result = await owner.caller.settings.update({
        code: MEETINGS_API_KEY,
        value: "  sk-trimmed  ",
      });

      expect(result).toEqual({ code: MEETINGS_API_KEY, hasValue: true });
      expect(await storedValue(MEETINGS_API_KEY)).toBe("sk-trimmed");

      const [row] = await db
        .select({ updatedBy: SettingsTable.updatedBy })
        .from(SettingsTable)
        .where(eq(SettingsTable.code, MEETINGS_API_KEY));
      expect(row.updatedBy).toBe(`${owner.userId}@integration.test`);
    });

    // Blank is how an admin disconnects an integration — there is no
    // separate "remove" action.
    test("an empty value clears the setting", async () => {
      await setStoredValue(MEETINGS_WEBHOOK_SECRET, "whsec-existing");

      const result = await owner.caller.settings.update({
        code: MEETINGS_WEBHOOK_SECRET,
        value: "   ",
      });

      expect(result).toEqual({
        code: MEETINGS_WEBHOOK_SECRET,
        hasValue: false,
      });
      expect(await storedValue(MEETINGS_WEBHOOK_SECRET)).toBeNull();
    });

    test("accepts an https URL and a localhost http URL", async () => {
      await owner.caller.settings.update({
        code: MEETINGS_API_URL,
        value: "https://meetings.example.com",
      });
      expect(await storedValue(MEETINGS_API_URL)).toBe(
        "https://meetings.example.com",
      );

      await owner.caller.settings.update({
        code: MEETINGS_API_URL,
        value: "http://localhost:4000",
      });
      expect(await storedValue(MEETINGS_API_URL)).toBe("http://localhost:4000");
    });

    // The API key travels in a header to whatever this URL says.
    test.each([
      "http://meetings.example.com",
      "not a url",
      "ftp://meetings.example.com",
    ])("refuses %s as the Meetings URL and stores nothing", async (value) => {
      await setStoredValue(MEETINGS_API_URL, "https://before.example.com");

      const code = await errorCodeOf(
        owner.caller.settings.update({ code: MEETINGS_API_URL, value }),
      );

      expect(code).toBe("BAD_REQUEST");
      expect(await storedValue(MEETINGS_API_URL)).toBe(
        "https://before.example.com",
      );
    });

    test("refuses an unregistered code", async () => {
      const code = await errorCodeOf(
        owner.caller.settings.update({ code: "99999", value: "anything" }),
      );

      expect(code).toBe("BAD_REQUEST");
      expect(await storedValue("99999")).toBeUndefined();
    });

    // A registered code without its seed row means the data migration hasn't
    // landed — reported, never created from a request.
    test("reports a missing seed row instead of creating it", async () => {
      await db
        .delete(SettingsTable)
        .where(eq(SettingsTable.code, MEETINGS_WEBHOOK_SECRET));

      const code = await errorCodeOf(
        owner.caller.settings.update({
          code: MEETINGS_WEBHOOK_SECRET,
          value: "whsec-new",
        }),
      );

      expect(code).toBe("NOT_FOUND");
      expect(await storedValue(MEETINGS_WEBHOOK_SECRET)).toBeUndefined();
    });
  });

  describe("gate", () => {
    test("the platform owner can list and update", async () => {
      expect(await errorCodeOf(owner.caller.settings.list())).toBeNull();
      expect(
        await errorCodeOf(
          owner.caller.settings.update({
            code: MEETINGS_API_KEY,
            value: "sk-owner",
          }),
        ),
      ).toBeNull();
      expect(await storedValue(MEETINGS_API_KEY)).toBe("sk-owner");
    });

    // R1: being an admin of an academy no longer reaches the deployment's
    // keys — the owner flag does, and nothing else.
    test.each([
      ["an org admin who is not the owner", () => admin.caller],
      ["a teacher", () => teacher.caller],
    ])("%s can neither list nor update", async (_who, callerOf) => {
      await setStoredValue(MEETINGS_API_KEY, "sk-before");

      expect(await errorCodeOf(callerOf().settings.list())).toBe("FORBIDDEN");
      expect(
        await errorCodeOf(
          callerOf().settings.update({
            code: MEETINGS_API_KEY,
            value: "sk-not-owner",
          }),
        ),
      ).toBe("FORBIDDEN");
      expect(await storedValue(MEETINGS_API_KEY)).toBe("sk-before");
    });
  });
});

/**
 * The server-side read the Meetings client uses (`meetings-config.ts`). It
 * returns raw values — secrets included — and must treat blank as unset, or
 * the client would send an empty key instead of reporting "not configured".
 */
describe("readSystemSettingValues", () => {
  let original: SettingSnapshot[];

  beforeAll(async () => {
    original = await snapshotSettings();
  });

  afterEach(async () => {
    await restoreSettings(original);
  });

  test("returns stored values, trimmed, secrets included", async () => {
    await setStoredValue(MEETINGS_API_URL, " https://meetings.example.com ");
    await setStoredValue(MEETINGS_API_KEY, "sk-raw");

    const values = await readSystemSettingValues(db, [
      MEETINGS_API_URL,
      MEETINGS_API_KEY,
    ]);

    expect(values.get(MEETINGS_API_URL)).toBe("https://meetings.example.com");
    expect(values.get(MEETINGS_API_KEY)).toBe("sk-raw");
  });

  test("returns null for a blank, a null and a missing row", async () => {
    await setStoredValue(MEETINGS_API_URL, "   ");
    await setStoredValue(MEETINGS_API_KEY, null);
    await db
      .delete(SettingsTable)
      .where(eq(SettingsTable.code, MEETINGS_WEBHOOK_SECRET));

    const values = await readSystemSettingValues(db, SYSTEM_SETTING_CODES);

    expect(values.get(MEETINGS_API_URL)).toBeNull();
    expect(values.get(MEETINGS_API_KEY)).toBeNull();
    expect(values.get(MEETINGS_WEBHOOK_SECRET)).toBeNull();
    expect(values.size).toBe(SYSTEM_SETTING_CODES.length);
  });
});
