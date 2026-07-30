import { describe, expect, test } from "vitest";
import {
  APPROACHING_LIMIT_RATIO,
  toStorageDisplay,
  usagePercent,
  usageSeverity,
} from "../src/features/core/organizations/lib/plan-usage";
import {
  computeUsageDrift,
  type StoredUsage,
  toUsageCorrection,
} from "../src/features/core/organizations/server/usage";

const BYTES_PER_MB = 1024 * 1024;
const BYTES_PER_GB = 1024 * BYTES_PER_MB;

const stored: StoredUsage = {
  studentCount: 12,
  courseCount: 3,
  storageBytes: 500,
};

describe("computeUsageDrift", () => {
  test("reports nothing when every measured counter agrees", () => {
    expect(
      computeUsageDrift(stored, {
        studentCount: 12,
        courseCount: 3,
        storageBytes: 500,
      }),
    ).toEqual([]);
  });

  test("reports the counters that drifted, with both values", () => {
    const drift = computeUsageDrift(stored, {
      studentCount: 10,
      courseCount: 3,
      storageBytes: 900,
    });

    expect(drift).toEqual([
      { counter: "studentCount", stored: 12, actual: 10 },
      { counter: "storageBytes", stored: 500, actual: 900 },
    ]);
  });

  test("leaves an unmeasured counter alone rather than zeroing it", () => {
    const drift = computeUsageDrift(stored, {
      studentCount: 12,
      courseCount: 3,
      storageBytes: null,
    });

    expect(drift).toEqual([]);
  });

  test("ignores a counter that is missing from the measurement entirely", () => {
    const drift = computeUsageDrift(stored, { studentCount: 12 });

    expect(drift).toEqual([]);
  });

  test("treats a drop to zero as real drift", () => {
    const drift = computeUsageDrift(stored, { courseCount: 0 });

    expect(drift).toEqual([{ counter: "courseCount", stored: 3, actual: 0 }]);
  });
});

describe("toUsageCorrection", () => {
  test("builds an update payload holding only the drifted counters", () => {
    const correction = toUsageCorrection([
      { counter: "studentCount", stored: 12, actual: 10 },
      { counter: "storageBytes", stored: 500, actual: 900 },
    ]);

    expect(correction).toEqual({ studentCount: 10, storageBytes: 900 });
  });

  test("is empty when nothing drifted", () => {
    expect(toUsageCorrection([])).toEqual({});
  });
});

describe("usagePercent", () => {
  test("rounds the fraction of the cap that is used", () => {
    expect(usagePercent(42, 50)).toBe(84);
  });

  test("is null when the plan does not cap this counter", () => {
    expect(usagePercent(1_000, null)).toBeNull();
  });

  test("never exceeds 100, even over the cap", () => {
    expect(usagePercent(60, 50)).toBe(100);
  });

  test("treats a zero cap as full instead of dividing by it", () => {
    expect(usagePercent(0, 0)).toBe(100);
  });
});

describe("usageSeverity", () => {
  test("is ok well below the cap", () => {
    expect(usageSeverity(10, 50)).toBe("ok");
  });

  test("warns from the approaching ratio onward", () => {
    expect(usageSeverity(50 * APPROACHING_LIMIT_RATIO, 50)).toBe("approaching");
    expect(usageSeverity(49, 50)).toBe("approaching");
  });

  test("is reached at the cap and beyond", () => {
    expect(usageSeverity(50, 50)).toBe("reached");
    expect(usageSeverity(51, 50)).toBe("reached");
  });

  test("is always ok on an uncapped plan", () => {
    expect(usageSeverity(10_000, null)).toBe("ok");
  });
});

describe("toStorageDisplay", () => {
  test("uses megabytes below a gigabyte", () => {
    expect(toStorageDisplay(400 * BYTES_PER_MB)).toEqual({
      amount: 400,
      unit: "mb",
    });
  });

  test("uses gigabytes from a gigabyte up", () => {
    expect(toStorageDisplay(BYTES_PER_GB)).toEqual({ amount: 1, unit: "gb" });
  });

  test("rounds to one decimal", () => {
    expect(toStorageDisplay(1.55 * BYTES_PER_GB)).toEqual({
      amount: 1.6,
      unit: "gb",
    });
  });

  test("reports an empty bucket as zero megabytes", () => {
    expect(toStorageDisplay(0)).toEqual({ amount: 0, unit: "mb" });
  });
});
