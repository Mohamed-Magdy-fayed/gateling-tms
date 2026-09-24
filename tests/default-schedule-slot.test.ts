import { describe, expect, test } from "vitest";
import {
  ACADEMY_SETTINGS,
  DEFAULT_CLASS_LENGTH_CODE,
  DEFAULT_CLASS_LENGTH_MINUTES,
} from "@/features/system/settings/lib/academy-settings-registry";
import {
  addMinutesToTime,
  defaultScheduleSlot,
} from "@/features/system/students/groups/lib/default-schedule-slot";

describe("default class length (academy preference 00001)", () => {
  test("is registered as a future-only 30–180 minute number, 60 by default", () => {
    const entry = ACADEMY_SETTINGS.find(
      (setting) => setting.code === DEFAULT_CLASS_LENGTH_CODE,
    );

    expect(entry).toMatchObject({
      group: "scheduling",
      control: { kind: "number", min: 30, max: 180, step: 15 },
      default: 60,
      appliesTo: "future",
    });
    expect(DEFAULT_CLASS_LENGTH_MINUTES).toBe(60);
  });
});

describe("defaultScheduleSlot", () => {
  test("with the default length a new slot is Monday 18:00–19:00", () => {
    expect(defaultScheduleSlot(60)).toEqual({
      day: 1,
      startTime: "18:00",
      endTime: "19:00",
    });
  });

  test("follows the academy's length", () => {
    expect(defaultScheduleSlot(90).endTime).toBe("19:30");
    expect(defaultScheduleSlot(180).endTime).toBe("21:00");
  });
});

describe("addMinutesToTime", () => {
  test("carries minutes into hours", () => {
    expect(addMinutesToTime("09:45", 30)).toBe("10:15");
  });

  test("stops at 23:59 rather than wrapping past midnight", () => {
    expect(addMinutesToTime("22:30", 180)).toBe("23:59");
  });
});
