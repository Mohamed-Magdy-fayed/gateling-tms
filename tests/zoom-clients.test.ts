import { describe, expect, test } from "vitest";
import {
  buildZoomClientsUrl,
  parseZoomConnectResultCode,
} from "../src/features/system/live-classes/zoom-clients/lib/redirect-codes";
import {
  zoomClientMutationSchema,
  zoomClientUpdateSchema,
} from "../src/features/system/live-classes/zoom-clients/server/schemas";
import { needsRefresh } from "../src/integrations/oauth/expiry";

const now = new Date("2026-07-29T12:00:00.000Z");

describe("zoom access token refresh boundary", () => {
  test("refreshes when there is no recorded expiry", () => {
    expect(needsRefresh(null, now)).toBe(true);
  });

  test("refreshes an already-expired token", () => {
    expect(needsRefresh(new Date("2026-07-29T11:59:00.000Z"), now)).toBe(true);
  });

  test("refreshes inside the skew window rather than at the last second", () => {
    // 30s left: still valid by the clock, but not long enough to survive the
    // API call it would be used for.
    expect(needsRefresh(new Date("2026-07-29T12:00:30.000Z"), now)).toBe(true);
  });

  test("keeps a token that has comfortable time left", () => {
    expect(needsRefresh(new Date("2026-07-29T12:30:00.000Z"), now)).toBe(false);
  });
});

describe("zoom connect result codes", () => {
  test("accepts every code the routes can emit", () => {
    for (const code of [
      "connected",
      "denied",
      "invalid_state",
      "connect_failed",
      "not_configured",
      "forbidden",
    ]) {
      expect(parseZoomConnectResultCode(code)).toBe(code);
    }
  });

  test("rejects anything else so a crafted link can't render arbitrary text", () => {
    expect(parseZoomConnectResultCode("<script>alert(1)</script>")).toBeNull();
    expect(parseZoomConnectResultCode("")).toBeNull();
    expect(parseZoomConnectResultCode(null)).toBeNull();
  });

  test("builds a redirect URL carrying only the code", () => {
    expect(buildZoomClientsUrl("connected")).toBe(
      "/live-classes/zoom-clients?zoomResult=connected",
    );
  });
});

describe("zoom client schemas", () => {
  test("requires a name", () => {
    expect(zoomClientMutationSchema.safeParse({ name: "  " }).success).toBe(
      false,
    );
  });

  test("trims the name it accepts", () => {
    const parsed = zoomClientMutationSchema.parse({ name: " Main licence " });

    expect(parsed.name).toBe("Main licence");
  });

  test("rejects a name longer than 256 characters", () => {
    const parsed = zoomClientMutationSchema.safeParse({
      name: "z".repeat(257),
    });

    expect(parsed.success).toBe(false);
  });

  test("update requires a uuid id", () => {
    expect(
      zoomClientUpdateSchema.safeParse({ name: "Main", id: "nope" }).success,
    ).toBe(false);
  });
});
