import { describe, expect, test } from "vitest";
import { resolveOrgAccess } from "../src/integrations/trpc/org-access";

describe("resolveOrgAccess", () => {
  test("grants access when the session's active org matches a real membership", () => {
    const access = resolveOrgAccess("org-a", { role: "admin" });

    expect(access).toEqual({ organizationId: "org-a", role: "admin" });
  });

  test("denies access when the session has no active organization", () => {
    expect(resolveOrgAccess(null, { role: "admin" })).toBeNull();
    expect(resolveOrgAccess(undefined, { role: "admin" })).toBeNull();
  });

  test("denies access for a cross-org session — active org set, but no membership row for it", () => {
    // Simulates a user who is a member of org A but whose session somehow
    // carries org B as active (forged/stale cookie, or a membership that
    // was revoked after the session was issued) — the membership lookup for
    // (user, org B) comes back empty, which must resolve to FORBIDDEN, not
    // silently fall back to any other org the user belongs to.
    expect(resolveOrgAccess("org-b", null)).toBeNull();
    expect(resolveOrgAccess("org-b", undefined)).toBeNull();
  });

  test("carries the membership's role through unchanged", () => {
    expect(resolveOrgAccess("org-a", { role: "teacher" })).toEqual({
      organizationId: "org-a",
      role: "teacher",
    });
    expect(resolveOrgAccess("org-a", { role: "student" })).toEqual({
      organizationId: "org-a",
      role: "student",
    });
  });
});
