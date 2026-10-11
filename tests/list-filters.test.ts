import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, test } from "vitest";
import { dateRangeInput, inDateRange } from "@/drizzle/lib/date-range";
import { CoursesTable } from "@/drizzle/schema";
import {
  dateRangeFilterBounds,
  dateRangeFilterFn,
  facetedFilterFn,
  selectedEnumFilterValues,
  selectedFilterValues,
} from "@/features/core/data-table/lib/filter-values";
import { academyGlobalFilter } from "@/features/system/settings/admin/components/academies-table-columns";
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
});

// Client-mode tables (definition lists) filter in the browser through these.
describe("client-mode filter functions", () => {
  const rowWith = (value: unknown) => ({ getValue: () => value });

  test("facetedFilterFn keeps rows whose value is one of the picked ones", () => {
    expect(facetedFilterFn(rowWith("quiz"), "type", ["quiz", "final"])).toBe(
      true,
    );
    expect(facetedFilterFn(rowWith("draft"), "type", ["quiz"])).toBe(false);
  });

  test("facetedFilterFn passes every row when nothing is picked", () => {
    expect(facetedFilterFn(rowWith("draft"), "type", [])).toBe(true);
    expect(facetedFilterFn(rowWith("draft"), "type", undefined)).toBe(true);
  });

  test("dateRangeFilterFn keeps rows inside the picked days, inclusive", () => {
    const range = { from: "2026-10-01", to: "2026-10-03" };
    const lateOnLastDay = new Date(2026, 9, 3, 23, 30);
    const dayAfter = new Date(2026, 9, 4, 0, 0, 1);
    expect(dateRangeFilterFn(rowWith(lateOnLastDay), "createdAt", range)).toBe(
      true,
    );
    expect(dateRangeFilterFn(rowWith(dayAfter), "createdAt", range)).toBe(
      false,
    );
    // tRPC can hand dates over as ISO strings; those compare the same way.
    expect(
      dateRangeFilterFn(
        rowWith(lateOnLastDay.toISOString()),
        "createdAt",
        range,
      ),
    ).toBe(true);
  });

  test("dateRangeFilterFn passes every row when no range is set", () => {
    expect(dateRangeFilterFn(rowWith(new Date()), "createdAt", undefined)).toBe(
      true,
    );
  });
});

describe("academyGlobalFilter", () => {
  const academy = {
    original: {
      id: "a",
      name: "Nour Academy",
      shortCode: "NR01",
      plan: "free" as const,
      studentCount: 0,
      courseCount: 0,
      storageBytes: 0,
      adminEmail: "owner@nour.example",
      planGrantedBy: null,
      planGrantedAt: null,
      isMine: false,
    },
  };

  test("matches name, short code or owner email, ignoring case", () => {
    expect(academyGlobalFilter(academy, "academy", "nour")).toBe(true);
    expect(academyGlobalFilter(academy, "academy", "nr01")).toBe(true);
    expect(academyGlobalFilter(academy, "academy", "OWNER@")).toBe(true);
    expect(academyGlobalFilter(academy, "academy", "other")).toBe(false);
  });

  test("an empty search matches everything", () => {
    expect(academyGlobalFilter(academy, "academy", "  ")).toBe(true);
  });
});
