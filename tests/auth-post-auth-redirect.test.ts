import { describe, expect, test } from "vitest";
import {
  buildCrossAuthLink,
  getPostAuthRedirect,
  isSafeReturnTo,
} from "../src/features/core/auth/nextjs/lib/post-auth-redirect";
import type { PartialUser } from "../src/features/core/auth/types";

function buildUser(overrides: Partial<PartialUser> = {}): PartialUser {
  return {
    id: "user_1",
    email: "trainer@example.com",
    name: "Trainer",
    emailVerifiedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("isSafeReturnTo", () => {
  test("accepts a same-origin absolute path", () => {
    expect(isSafeReturnTo("/dashboard")).toBe(true);
  });

  test("rejects undefined", () => {
    expect(isSafeReturnTo(undefined)).toBe(false);
  });

  test("rejects a protocol-relative URL (open redirect)", () => {
    expect(isSafeReturnTo("//evil.example.com")).toBe(false);
  });

  test("rejects a backslash-prefixed path (browsers treat it like //)", () => {
    expect(isSafeReturnTo("/\\evil.example.com")).toBe(false);
  });

  test("rejects a path that doesn't start with a slash", () => {
    expect(isSafeReturnTo("evil.example.com")).toBe(false);
  });
});

describe("getPostAuthRedirect", () => {
  test("sends an unverified user to the verify-email page with no returnTo", () => {
    const user = buildUser({ emailVerifiedAt: null });
    expect(getPostAuthRedirect(user, undefined)).toBe("/auth/verify-email");
  });

  test("carries a safe returnTo through to the verify-email page for an unverified user", () => {
    // e.g. an invite link (/invite/<token>) that routed a brand-new visitor
    // through sign-up — they must land back there once verified, not be
    // stranded logged-in with nowhere to go (STATE.md D49).
    const user = buildUser({ emailVerifiedAt: null });
    expect(getPostAuthRedirect(user, "/invite/abc123")).toBe(
      "/auth/verify-email?returnTo=%2Finvite%2Fabc123",
    );
  });

  test("drops an unsafe returnTo for an unverified user instead of embedding it", () => {
    const user = buildUser({ emailVerifiedAt: null });
    expect(getPostAuthRedirect(user, "//evil.example.com")).toBe(
      "/auth/verify-email",
    );
  });

  test("honors a safe returnTo for a verified user", () => {
    const user = buildUser();
    expect(getPostAuthRedirect(user, "/auth/passkeys")).toBe(
      "/auth/passkeys",
    );
  });

  test("falls back to the dashboard for a verified user with no returnTo", () => {
    const user = buildUser();
    expect(getPostAuthRedirect(user, undefined)).toBe("/dashboard");
  });

  test("falls back to the dashboard for a verified user with an unsafe returnTo", () => {
    const user = buildUser();
    expect(getPostAuthRedirect(user, "//evil.example.com")).toBe("/dashboard");
  });
});

describe("buildCrossAuthLink", () => {
  test("returns the bare path when there's nothing to carry over", () => {
    const params = new URLSearchParams();
    expect(buildCrossAuthLink("/auth/sign-up", params)).toBe("/auth/sign-up");
  });

  test("carries returnTo and email over to the other form", () => {
    // e.g. an invite link routed the visitor to sign-up with these params —
    // clicking over to sign-in instead must not lose that context.
    const params = new URLSearchParams({
      returnTo: "/invite/abc123",
      email: "trainer@example.com",
    });
    expect(buildCrossAuthLink("/auth/sign-in", params)).toBe(
      "/auth/sign-in?returnTo=%2Finvite%2Fabc123&email=trainer%40example.com",
    );
  });

  test("carries only the params that are actually present", () => {
    const params = new URLSearchParams({ email: "trainer@example.com" });
    expect(buildCrossAuthLink("/auth/sign-in", params)).toBe(
      "/auth/sign-in?email=trainer%40example.com",
    );
  });
});
