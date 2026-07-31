import { describe, expect, test } from "vitest";
import {
  buildContentSecurityPolicy,
  createCspNonce,
} from "../src/integrations/security/csp";

function directives(policy: string): Map<string, string> {
  return new Map(
    policy.split("; ").map((entry) => {
      const [name, ...rest] = entry.split(" ");
      return [name, rest.join(" ")];
    }),
  );
}

const production = buildContentSecurityPolicy({
  nonce: "testnonce",
  isDevelopment: false,
});
const development = buildContentSecurityPolicy({
  nonce: "testnonce",
  isDevelopment: true,
});

describe("buildContentSecurityPolicy", () => {
  test("carries the request's nonce in script-src", () => {
    expect(directives(production).get("script-src")).toContain(
      "'nonce-testnonce'",
    );
  });

  // The whole reason for the nonce: if script-src ever allows inline scripts,
  // the policy stops defending against the attack it exists for.
  test("never allows inline scripts, in either environment", () => {
    expect(directives(production).get("script-src")).not.toContain(
      "'unsafe-inline'",
    );
    expect(directives(development).get("script-src")).not.toContain(
      "'unsafe-inline'",
    );
  });

  test("allows eval in development only, for React's error-stack rebuilding", () => {
    expect(directives(development).get("script-src")).toContain(
      "'unsafe-eval'",
    );
    expect(directives(production).get("script-src")).not.toContain(
      "'unsafe-eval'",
    );
  });

  // Deliberate, and documented in csp.ts: Base UI/Radix set inline style
  // attributes, which cannot carry a nonce.
  test("allows inline styles", () => {
    expect(directives(production).get("style-src")).toContain(
      "'unsafe-inline'",
    );
  });

  test("allows images from the two hosts the app actually serves them from", () => {
    const imgSrc = directives(production).get("img-src") ?? "";
    expect(imgSrc).toContain("https://storage.googleapis.com");
    expect(imgSrc).toContain("https://lh3.googleusercontent.com");
    // Not a blanket https: — a new host has to be a deliberate edit.
    expect(imgSrc).not.toMatch(/(^|\s)https:($|\s)/);
  });

  test("blocks framing and plugins outright", () => {
    const parsed = directives(production);
    expect(parsed.get("frame-ancestors")).toBe("'none'");
    expect(parsed.get("object-src")).toBe("'none'");
    expect(parsed.get("base-uri")).toBe("'self'");
    expect(parsed.get("form-action")).toBe("'self'");
  });

  test("upgrades insecure requests in production but not on localhost", () => {
    expect(production).toContain("upgrade-insecure-requests");
    expect(development).not.toContain("upgrade-insecure-requests");
  });
});

describe("createCspNonce", () => {
  test("returns a distinct value every call", () => {
    const nonces = new Set(Array.from({ length: 100 }, () => createCspNonce()));
    expect(nonces.size).toBe(100);
  });

  test("returns a value safe to embed in a header and an attribute", () => {
    expect(createCspNonce()).toMatch(/^[0-9a-f]{32}$/);
  });
});
