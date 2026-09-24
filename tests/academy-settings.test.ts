import { describe, expect, test } from "vitest";
import {
  academySettingValueSchema,
  findAcademySettingDefinition,
  listAcademySettingDefinitions,
} from "../src/features/system/settings/lib/academy-settings";
import {
  resetAcademySettingSchema,
  updateAcademySettingSchema,
} from "../src/features/system/settings/server/schemas";

/**
 * The academy-preferences registry and the one helper that turns a declared
 * control into validation (design doc `academy-preferences.md` R4). The
 * registry-wide checks run over whatever is registered, so they hold every
 * future entry to the same contract; the control checks use their own
 * controls because the registry may be empty.
 */
describe("academy settings registry", () => {
  test("codes are zero-padded, five digits, and registered once", () => {
    const codes = listAcademySettingDefinitions().map((entry) => entry.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const code of codes) expect(code).toMatch(/^\d{5}$/);
  });

  test("every default parses under its own control", () => {
    for (const entry of listAcademySettingDefinitions()) {
      expect(
        academySettingValueSchema(entry.control).safeParse(entry.default)
          .success,
        `default of ${entry.code}`,
      ).toBe(true);
    }
  });

  test("every reapply entry names an Inngest event", () => {
    for (const entry of listAcademySettingDefinitions()) {
      if (entry.appliesTo === "future") continue;
      expect(entry.appliesTo.reapply).toMatch(/^[a-z0-9-]+\/[a-z0-9-]+$/);
    }
  });

  test("an unknown code is refused, not guessed", () => {
    expect(findAcademySettingDefinition("99999")).toBeUndefined();
    expect(findAcademySettingDefinition("")).toBeUndefined();
  });
});

describe("academySettingValueSchema", () => {
  test("boolean accepts true/false and nothing else", () => {
    const schema = academySettingValueSchema({ kind: "boolean" });
    expect(schema.safeParse(true).success).toBe(true);
    expect(schema.safeParse(false).success).toBe(true);
    expect(schema.safeParse("true").success).toBe(false);
    expect(schema.safeParse(1).success).toBe(false);
  });

  test("enum accepts only its declared options", () => {
    const schema = academySettingValueSchema({
      kind: "enum",
      options: ["weekly", "monthly"],
    });
    expect(schema.safeParse("weekly").success).toBe(true);
    expect(schema.safeParse("monthly").success).toBe(true);
    expect(schema.safeParse("daily").success).toBe(false);
    expect(schema.safeParse("").success).toBe(false);
    expect(schema.safeParse(true).success).toBe(false);
  });

  test("number accepts values inside the bounds and on a step", () => {
    const schema = academySettingValueSchema({
      kind: "number",
      min: 30,
      max: 180,
      step: 15,
    });
    for (const value of [30, 45, 60, 180]) {
      expect(schema.safeParse(value).success, `${value}`).toBe(true);
    }
    for (const value of [15, 195, 31, Number.NaN, "60"]) {
      expect(schema.safeParse(value).success, `${value}`).toBe(false);
    }
  });

  test("number steps survive floating-point arithmetic", () => {
    const schema = academySettingValueSchema({
      kind: "number",
      min: 0,
      max: 1,
      step: 0.1,
    });
    expect(schema.safeParse(0.1 + 0.2).success).toBe(true);
    expect(schema.safeParse(0.35).success).toBe(false);
  });
});

describe("academy settings input schemas", () => {
  test("update accepts each control's value type", () => {
    for (const value of [true, 60, "weekly"]) {
      expect(
        updateAcademySettingSchema.safeParse({ code: "00001", value }).success,
      ).toBe(true);
    }
  });

  test("update refuses a missing code, an object value or an oversized string", () => {
    expect(
      updateAcademySettingSchema.safeParse({ code: "", value: true }).success,
    ).toBe(false);
    expect(
      updateAcademySettingSchema.safeParse({ code: "00001", value: {} })
        .success,
    ).toBe(false);
    expect(
      updateAcademySettingSchema.safeParse({
        code: "00001",
        value: "x".repeat(129),
      }).success,
    ).toBe(false);
  });

  test("reset needs only a code", () => {
    expect(resetAcademySettingSchema.safeParse({ code: "00001" }).success).toBe(
      true,
    );
    expect(resetAcademySettingSchema.safeParse({}).success).toBe(false);
  });
});
