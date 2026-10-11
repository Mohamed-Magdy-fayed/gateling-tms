import { describe, expect, test } from "vitest";
import {
  pickWriteBranch,
  resolveBranchAccess,
} from "../src/integrations/trpc/org-access";

const academy = ["nasr", "maadi", "online"];

describe("resolveBranchAccess", () => {
  test("an admin with no branch selected sees every branch (All branches)", () => {
    expect(
      resolveBranchAccess({
        role: "admin",
        academyBranchIds: academy,
        assignedBranchIds: [],
        requestedBranchId: null,
      }),
    ).toEqual({ branchIds: academy, activeBranchId: null, visibleBranchIds: academy });
  });

  test("an admin who picked a branch is scoped to it", () => {
    expect(
      resolveBranchAccess({
        role: "admin",
        academyBranchIds: academy,
        assignedBranchIds: [],
        requestedBranchId: "maadi",
      }),
    ).toEqual({ branchIds: ["maadi"], activeBranchId: "maadi", visibleBranchIds: academy });
  });

  test("an admin's assignments never narrow what they see", () => {
    const access = resolveBranchAccess({
      role: "admin",
      academyBranchIds: academy,
      assignedBranchIds: ["nasr"],
      requestedBranchId: null,
    });
    expect(access.branchIds).toEqual(academy);
  });

  test("staff assigned to branches only see those, even under All", () => {
    expect(
      resolveBranchAccess({
        role: "teacher",
        academyBranchIds: academy,
        assignedBranchIds: ["nasr", "online"],
        requestedBranchId: null,
      }),
    ).toEqual({
      branchIds: ["nasr", "online"],
      activeBranchId: null,
      visibleBranchIds: ["nasr", "online"],
    });
  });

  test("staff can't select a branch they aren't assigned to — falls back to their own", () => {
    const access = resolveBranchAccess({
      role: "teacher",
      academyBranchIds: academy,
      assignedBranchIds: ["nasr"],
      requestedBranchId: "maadi",
    });
    expect(access.branchIds).toEqual(["nasr"]);
    expect(access.activeBranchId).toBe("nasr");
  });

  test("staff with no assignments see the whole academy (pre-branches behaviour)", () => {
    const access = resolveBranchAccess({
      role: "teacher",
      academyBranchIds: academy,
      assignedBranchIds: [],
      requestedBranchId: null,
    });
    expect(access.branchIds).toEqual(academy);
  });

  test("a branch from another academy is ignored", () => {
    const access = resolveBranchAccess({
      role: "admin",
      academyBranchIds: academy,
      assignedBranchIds: ["elsewhere"],
      requestedBranchId: "elsewhere",
    });
    expect(access.branchIds).toEqual(academy);
    expect(access.activeBranchId).toBeNull();
  });

  test("a single visible branch is always the active one", () => {
    const access = resolveBranchAccess({
      role: "admin",
      academyBranchIds: ["main"],
      assignedBranchIds: [],
      requestedBranchId: null,
    });
    expect(access).toEqual({ branchIds: ["main"], activeBranchId: "main", visibleBranchIds: ["main"] });
  });
});

describe("pickWriteBranch", () => {
  test("uses the active branch when the caller doesn't name one", () => {
    expect(pickWriteBranch({ branchIds: ["maadi"], activeBranchId: "maadi" }, undefined)).toBe("maadi");
  });

  test("accepts a named branch inside the current scope", () => {
    expect(pickWriteBranch({ branchIds: academy, activeBranchId: null }, "online")).toBe("online");
  });

  test("refuses a named branch outside the current scope", () => {
    expect(pickWriteBranch({ branchIds: ["nasr"], activeBranchId: "nasr" }, "maadi")).toBeNull();
  });

  test("needs an explicit branch when several are in scope", () => {
    expect(pickWriteBranch({ branchIds: academy, activeBranchId: null }, undefined)).toBeNull();
  });
});
