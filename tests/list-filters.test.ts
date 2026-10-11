import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, test } from "vitest";
import { dateRangeInput, inDateRange } from "@/drizzle/lib/date-range";
import { CoursesTable } from "@/drizzle/schema";
import {
  dateRangeFilterBounds,
  selectedEnumFilterValues,
  selectedFilterValues,
} from "@/features/core/data-table/lib/filter-values";
import { listPlatformOrganizationsInput } from "@/features/core/organizations/server/schemas";
import { listFormsInput } from "@/features/system/assessments/forms/server/schemas";
import { listCertificatesInput } from "@/features/system/students/certificates/server/schemas";
import { listEnrollmentsInput } from "@/features/system/students/enrollments/server/schemas";

const courseId = "7a2d5f18-9c34-4b6e-8f21-5d0c3a7b9e42";

describe("selectedFilterValues", () => {
  test("returns the picked values of the named column", () => {
    const filters = [
      { id: "status", value: ["ongoing", "waiting"] },
      { id: "courseName", value: [courseId] },
    ];
    expect(selectedFilterValues(filters, "courseName")).toEqual([courseId]);
  });

  test("is empty when the column has no filter or a non-list value", () => {
    expect(selectedFilterValues([], "status")).toEqual([]);
    expect(
      selectedFilterValues([{ id: "status", value: "ongoing" }], "status"),
    ).toEqual([]);
  });

  test("drops non-string entries a hand-edited URL could carry", () => {
    expect(
      selectedFilterValues([{ id: "status", value: ["a", 1, null] }], "status"),
    ).toEqual(["a"]);
  });
});

describe("selectedEnumFilterValues", () => {
  test("keeps only values the enum allows", () => {
    const filters = [{ id: "plan", value: ["free", "bogus", "basic"] }];
    expect(
      selectedEnumFilterValues(filters, "plan", [
        "free",
        "basic",
        "enterprise",
      ]),
    ).toEqual(["free", "basic"]);
  });
});

describe("dateRangeFilterBounds", () => {
  test("turns local days into UTC instants spanning both whole days", () => {
    const bounds = dateRangeFilterBounds(
      [{ id: "createdAt", value: { from: "2026-10-01", to: "2026-10-03" } }],
      "createdAt",
    );
    expect(bounds?.from).toBe(new Date(2026, 9, 1, 0, 0, 0, 0).toISOString());
    expect(bounds?.to).toBe(
      new Date(2026, 9, 3, 23, 59, 59, 999).toISOString(),
    );
  });

  test("is undefined when nothing is picked", () => {
    expect(dateRangeFilterBounds([], "createdAt")).toBeUndefined();
    expect(
      dateRangeFilterBounds([{ id: "createdAt", value: {} }], "createdAt"),
    ).toBeUndefined();
    expect(
      dateRangeFilterBounds(
        [{ id: "createdAt", value: { from: " ", to: "" } }],
        "createdAt",
      ),
    ).toBeUndefined();
  });
});

describe("dateRangeInput / inDateRange", () => {
  const dialect = new PgDialect();
  const render = (range: Parameters<typeof inDateRange>[1]) => {
    const condition = inDateRange(CoursesTable.createdAt, range);
    return condition ? dialect.sqlToQuery(condition) : undefined;
  };

  test("accepts instants and rejects anything else", () => {
    expect(
      dateRangeInput.safeParse({ from: "2026-10-01T00:00:00.000Z" }).success,
    ).toBe(true);
    expect(dateRangeInput.safeParse({ from: "2026-10-01" }).success).toBe(
      false,
    );
    expect(dateRangeInput.safeParse(undefined).success).toBe(true);
  });

  test("adds no condition when neither bound is set", () => {
    expect(render(undefined)).toBeUndefined();
    expect(render({})).toBeUndefined();
  });

  test("bounds the column inclusively on each side that is set", () => {
    const both = render({
      from: "2026-10-01T00:00:00.000Z",
      to: "2026-10-03T23:59:59.999Z",
    });
    expect(both?.sql).toContain(">=");
    expect(both?.sql).toContain("<=");
    expect(both?.params).toHaveLength(2);

    const fromOnly = render({ from: "2026-10-01T00:00:00.000Z" });
    expect(fromOnly?.sql).toContain(">=");
    expect(fromOnly?.sql).not.toContain("<=");
  });
});

describe("list filter inputs", () => {
  test("enrollments take statuses, course ids and an enrolled-on range", () => {
    const result = listEnrollmentsInput.safeParse({
      statuses: ["ongoing", "waiting"],
      courseIds: [courseId],
      createdAt: { from: "2026-10-01T00:00:00.000Z" },
    });
    expect(result.success).toBe(true);
    expect(listEnrollmentsInput.safeParse({ statuses: ["paid"] }).success).toBe(
      false,
    );
    expect(
      listEnrollmentsInput.safeParse({ courseIds: ["not-an-id"] }).success,
    ).toBe(false);
  });

  test("certificates take course and group ids", () => {
    expect(
      listCertificatesInput.safeParse({
        courseIds: [courseId],
        groupIds: [courseId],
      }).success,
    ).toBe(true);
  });

  test("forms take types and statuses from their enums", () => {
    expect(
      listFormsInput.safeParse({ types: ["quiz"], statuses: ["draft"] })
        .success,
    ).toBe(true);
    expect(listFormsInput.safeParse({ types: ["survey"] }).success).toBe(false);
  });

  test("the academies list takes plans from the plan enum", () => {
    expect(
      listPlatformOrganizationsInput.safeParse({ plans: ["free", "basic"] })
        .success,
    ).toBe(true);
    expect(
      listPlatformOrganizationsInput.safeParse({ plans: ["gold"] }).success,
    ).toBe(false);
  });
});
