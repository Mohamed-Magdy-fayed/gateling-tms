import { and, eq } from "drizzle-orm";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { db } from "@/drizzle";
import { OrganizationSettingsTable } from "@/drizzle/schema";
import type { AcademySettingDefinition } from "@/features/system/settings/lib/academy-settings-registry";
import { readAcademySettings } from "@/features/system/settings/server";
import { inngest } from "@/integrations/inngest/client";
import {
  createMember,
  createTenant,
  destroyMember,
  destroyTenant,
  errorCodeOf,
  type TenantFixture,
} from "./lib/harness";

/**
 * Academy preferences through the real tRPC caller and database (design doc
 * `academy-preferences.md` R2, R3, R10). The real registry is empty until a
 * real academy asks for a preference, so these run against three test
 * entries — one per control kind, one of them reapply — swapped in for the
 * registry module. Everything else (procedures, reader, upsert, the
 * transaction around the enqueue) is the production code.
 */

// Hoisted with vi.mock, which runs before this module's own top level.
const { REAPPLY_EVENT, TEST_SETTINGS } = vi.hoisted(() => {
  const REAPPLY_EVENT = "academy-settings/test-reapplied";
  const TEST_SETTINGS = [
    {
      code: "90001",
      group: "attendance",
      control: { kind: "boolean" },
      default: false,
      appliesTo: "future",
    },
    {
      code: "90002",
      group: "scheduling",
      control: { kind: "enum", options: ["weekly", "monthly"] },
      default: "weekly",
      appliesTo: "future",
    },
    {
      code: "90003",
      group: "scheduling",
      control: { kind: "number", min: 30, max: 180, step: 15 },
      default: 60,
      appliesTo: { reapply: REAPPLY_EVENT },
    },
  ] satisfies AcademySettingDefinition[];
  return { REAPPLY_EVENT, TEST_SETTINGS };
});

vi.mock(
  "@/features/system/settings/lib/academy-settings-registry",
  async (importOriginal) => ({
    ...(await importOriginal<object>()),
    ACADEMY_SETTINGS: TEST_SETTINGS,
  }),
);

const BOOLEAN = "90001";
const ENUM = "90002";
const REAPPLY = "90003";

async function rowsOf(organizationId: string) {
  return db
    .select({
      code: OrganizationSettingsTable.code,
      value: OrganizationSettingsTable.value,
      createdBy: OrganizationSettingsTable.createdBy,
      updatedBy: OrganizationSettingsTable.updatedBy,
    })
    .from(OrganizationSettingsTable)
    .where(eq(OrganizationSettingsTable.organizationId, organizationId))
    .orderBy(OrganizationSettingsTable.code);
}

async function clearRows(organizationId: string) {
  await db
    .delete(OrganizationSettingsTable)
    .where(eq(OrganizationSettingsTable.organizationId, organizationId));
}

describe("academy settings", () => {
  const suffix = Date.now().toString().slice(-5);
  let academy: TenantFixture;
  let teacher: Awaited<ReturnType<typeof createMember>>;
  const send = vi.spyOn(inngest, "send");

  beforeAll(async () => {
    academy = await createTenant(`AS${suffix}`, "Preferences Academy");
    teacher = await createMember(academy, "teacher");
  });

  afterEach(async () => {
    await clearRows(academy.organizationId);
    send.mockReset();
  });

  afterAll(async () => {
    send.mockRestore();
    await destroyMember(teacher.userId);
    await destroyTenant(academy);
  });

  describe("gate", () => {
    test("a teacher can neither list, update nor reset", async () => {
      const settings = teacher.caller.settings.academy;
      expect(await errorCodeOf(settings.list())).toBe("FORBIDDEN");
      expect(
        await errorCodeOf(settings.update({ code: BOOLEAN, value: true })),
      ).toBe("FORBIDDEN");
      expect(await errorCodeOf(settings.reset({ code: BOOLEAN }))).toBe(
        "FORBIDDEN",
      );
      expect(await rowsOf(academy.organizationId)).toEqual([]);
    });
  });

  describe("list and read", () => {
    test("with no rows every preference is its default, in registry order", async () => {
      const rows = await academy.caller.settings.academy.list();

      expect(rows).toEqual([
        {
          code: BOOLEAN,
          group: "attendance",
          control: { kind: "boolean" },
          appliesTo: "future",
          value: false,
          defaultValue: false,
          isCustom: false,
          updatedAt: null,
        },
        expect.objectContaining({ code: ENUM, value: "weekly" }),
        expect.objectContaining({
          code: REAPPLY,
          appliesTo: "reapply",
          value: 60,
          isCustom: false,
        }),
      ]);
      expect(await readAcademySettings(db, academy.organizationId)).toEqual({
        [BOOLEAN]: false,
        [ENUM]: "weekly",
        [REAPPLY]: 60,
      });
    });

    test("an invalid stored value falls back to the default and is logged", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      await db.insert(OrganizationSettingsTable).values({
        organizationId: academy.organizationId,
        code: ENUM,
        value: "daily",
        createdBy: "integration-test",
      });

      const settings = await readAcademySettings(db, academy.organizationId);

      expect(settings[ENUM as keyof typeof settings]).toBe("weekly");
      expect(error).toHaveBeenCalledWith(
        expect.stringContaining(
          `organizationId=${academy.organizationId}, code=${ENUM}`,
        ),
        expect.anything(),
      );
      error.mockRestore();
    });

    test("a row for an unknown or retired code is ignored", async () => {
      await db.insert(OrganizationSettingsTable).values({
        organizationId: academy.organizationId,
        code: "99999",
        value: true,
        createdBy: "integration-test",
      });

      expect(
        Object.keys(await readAcademySettings(db, academy.organizationId)),
      ).toEqual([BOOLEAN, ENUM, REAPPLY]);
      expect(
        (await academy.caller.settings.academy.list()).map((r) => r.code),
      ).toEqual([BOOLEAN, ENUM, REAPPLY]);
    });
  });

  describe("update", () => {
    test("a saved value wins over the default and records who saved it", async () => {
      const result = await academy.caller.settings.academy.update({
        code: ENUM,
        value: "monthly",
      });

      expect(result).toEqual({ code: ENUM, value: "monthly", isCustom: true });
      expect(await rowsOf(academy.organizationId)).toEqual([
        {
          code: ENUM,
          value: "monthly",
          // The harness session's email for the academy's admin.
          createdBy: `${academy.userId}@integration.test`,
          updatedBy: `${academy.userId}@integration.test`,
        },
      ]);
      const [listed] = (await academy.caller.settings.academy.list()).filter(
        (r) => r.code === ENUM,
      );
      expect(listed).toMatchObject({ value: "monthly", isCustom: true });
      expect(listed.updatedAt).toBeInstanceOf(Date);
    });

    test("saving twice leaves one row with the latest value", async () => {
      await academy.caller.settings.academy.update({
        code: BOOLEAN,
        value: true,
      });
      await Promise.all([
        academy.caller.settings.academy.update({ code: BOOLEAN, value: false }),
        academy.caller.settings.academy.update({ code: BOOLEAN, value: false }),
      ]);

      expect(await rowsOf(academy.organizationId)).toEqual([
        expect.objectContaining({ code: BOOLEAN, value: false }),
      ]);
    });

    test.each([
      ["a boolean given text", BOOLEAN, "true"],
      ["an enum given an undeclared option", ENUM, "daily"],
      ["a number off its step", REAPPLY, 50],
      ["a number above its max", REAPPLY, 195],
    ])(
      "%s is BAD_REQUEST and nothing is written",
      async (_case, code, value) => {
        expect(
          await errorCodeOf(
            academy.caller.settings.academy.update({ code, value }),
          ),
        ).toBe("BAD_REQUEST");
        expect(await rowsOf(academy.organizationId)).toEqual([]);
        expect(send).not.toHaveBeenCalled();
      },
    );

    test("an unknown code is BAD_REQUEST", async () => {
      expect(
        await errorCodeOf(
          academy.caller.settings.academy.update({
            code: "99999",
            value: true,
          }),
        ),
      ).toBe("BAD_REQUEST");
    });
  });

  describe("reset", () => {
    test("deletes the academy's row, so the default applies again", async () => {
      await academy.caller.settings.academy.update({
        code: ENUM,
        value: "monthly",
      });

      const result = await academy.caller.settings.academy.reset({
        code: ENUM,
      });

      expect(result).toEqual({ code: ENUM, value: "weekly", isCustom: false });
      expect(await rowsOf(academy.organizationId)).toEqual([]);
    });

    test("resetting a preference that follows the default is a no-op", async () => {
      await academy.caller.settings.academy.reset({ code: REAPPLY });

      expect(await rowsOf(academy.organizationId)).toEqual([]);
      expect(send).not.toHaveBeenCalled();
    });

    test("an unknown code is BAD_REQUEST", async () => {
      expect(
        await errorCodeOf(
          academy.caller.settings.academy.reset({ code: "99999" }),
        ),
      ).toBe("BAD_REQUEST");
    });
  });

  describe("change effect (R3, R10)", () => {
    test("a future-only save enqueues nothing", async () => {
      await academy.caller.settings.academy.update({
        code: BOOLEAN,
        value: true,
      });

      expect(send).not.toHaveBeenCalled();
    });

    test("a reapply save enqueues exactly one event with the academy and code", async () => {
      send.mockResolvedValue({ ids: ["test"] });

      await academy.caller.settings.academy.update({
        code: REAPPLY,
        value: 90,
      });

      expect(send).toHaveBeenCalledTimes(1);
      expect(send).toHaveBeenCalledWith({
        name: REAPPLY_EVENT,
        data: { organizationId: academy.organizationId, code: REAPPLY },
      });
    });

    test("saving the value a reapply preference already has enqueues nothing", async () => {
      send.mockResolvedValue({ ids: ["test"] });

      await academy.caller.settings.academy.update({
        code: REAPPLY,
        value: 60,
      });

      expect(send).not.toHaveBeenCalled();
      expect(await rowsOf(academy.organizationId)).toEqual([
        expect.objectContaining({ code: REAPPLY, value: 60 }),
      ]);
    });

    test("resetting a custom reapply preference enqueues one event", async () => {
      send.mockResolvedValue({ ids: ["test"] });
      await academy.caller.settings.academy.update({
        code: REAPPLY,
        value: 90,
      });
      send.mockClear();

      await academy.caller.settings.academy.reset({ code: REAPPLY });

      expect(send).toHaveBeenCalledTimes(1);
      expect(await rowsOf(academy.organizationId)).toEqual([]);
    });

    test("a failed enqueue stores nothing: the save rolls back", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      send.mockResolvedValueOnce({ ids: ["test"] });
      await academy.caller.settings.academy.update({
        code: REAPPLY,
        value: 90,
      });
      send.mockRejectedValueOnce(new Error("Inngest unreachable"));

      const failure = academy.caller.settings.academy.update({
        code: REAPPLY,
        value: 120,
      });

      await expect(failure).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Nothing changed. Try again.",
      });
      const [row] = await db
        .select({ value: OrganizationSettingsTable.value })
        .from(OrganizationSettingsTable)
        .where(
          and(
            eq(
              OrganizationSettingsTable.organizationId,
              academy.organizationId,
            ),
            eq(OrganizationSettingsTable.code, REAPPLY),
          ),
        );
      expect(row.value).toBe(90);
      error.mockRestore();
    });

    test("a failed enqueue on reset keeps the custom value", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      send.mockResolvedValueOnce({ ids: ["test"] });
      await academy.caller.settings.academy.update({
        code: REAPPLY,
        value: 90,
      });
      send.mockRejectedValueOnce(new Error("Inngest unreachable"));

      expect(
        await errorCodeOf(
          academy.caller.settings.academy.reset({ code: REAPPLY }),
        ),
      ).toBe("INTERNAL_SERVER_ERROR");
      expect(await rowsOf(academy.organizationId)).toEqual([
        expect.objectContaining({ code: REAPPLY, value: 90 }),
      ]);
      error.mockRestore();
    });
  });
});
