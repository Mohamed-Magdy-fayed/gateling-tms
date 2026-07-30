import crypto from "node:crypto";
import { env } from "@/data/env/server";
import type { Cookies } from "@/features/core/auth/types";

const STATE_COOKIE_KEY = "googleConnectState";
const COOKIE_EXPIRATION_SECONDS = 60 * 10;

/**
 * The `state` round trip that stops a third party from feeding us an
 * authorization code for *their* Google account. Mirrors the auth OAuth
 * client's state cookie (features/core/auth/core/oauth/base.ts) and Zoom's.
 *
 * The cookie carries only the nonce, no row id: an org has exactly one Google
 * grant (unique index on `organizationId`), so the row this handshake writes
 * is determined by the session's active org, never by anything that travelled
 * through the browser.
 */
export function createGoogleConnectState(
  cookies: Pick<Cookies, "set">,
): string {
  const state = crypto.randomBytes(32).toString("hex");

  cookies.set(STATE_COOKIE_KEY, state, {
    // Matches session.ts's policy: `secure: true` unconditionally would stop
    // the cookie being written on the http://localhost dev flow.
    secure: env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    expires: new Date(Date.now() + COOKIE_EXPIRATION_SECONDS * 1000),
  });

  return state;
}

export function clearGoogleConnectState(
  cookies: Pick<Cookies, "delete">,
): void {
  cookies.delete(STATE_COOKIE_KEY);
}

/** True only when the returned state matches the one this browser was given. */
export function consumeGoogleConnectState(
  cookies: Cookies,
  returnedState: string,
): boolean {
  const stored = cookies.get(STATE_COOKIE_KEY)?.value;
  cookies.delete(STATE_COOKIE_KEY);
  if (!stored) return false;

  return timingSafeEquals(stored, returnedState);
}

function timingSafeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}
