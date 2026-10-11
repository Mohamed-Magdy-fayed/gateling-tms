import { describe, expect, it } from "vitest";
import { showcaseSeedDecision } from "@/drizzle/seed/profiles/showcase/guard";

const allowed = (env: Record<string, string | undefined>) =>
  showcaseSeedDecision(env).allowed;

describe("showcase seed guard", () => {
  it("runs on a Vercel preview build", () => {
    expect(allowed({ VERCEL: "1", VERCEL_ENV: "preview" })).toBe(true);
  });

  it("never runs on a Vercel production build", () => {
    expect(allowed({ VERCEL: "1", VERCEL_ENV: "production" })).toBe(false);
    expect(
      allowed({
        VERCEL: "1",
        VERCEL_ENV: "preview",
        VERCEL_TARGET_ENV: "production",
      }),
    ).toBe(false);
  });

  it("fails closed on Vercel when VERCEL_ENV is missing or unexpected", () => {
    expect(allowed({ VERCEL: "1" })).toBe(false);
    expect(allowed({ VERCEL: "1", VERCEL_ENV: "development" })).toBe(false);
    expect(allowed({ VERCEL: "1", VERCEL_ENV: "staging" })).toBe(false);
  });

  it("runs locally, off Vercel", () => {
    expect(allowed({})).toBe(true);
    expect(allowed({ VERCEL_ENV: "development" })).toBe(true);
  });

  it("refuses locally too when the env claims production", () => {
    expect(allowed({ VERCEL_ENV: "production" })).toBe(false);
  });
});
