import crypto from "node:crypto";
import { z } from "zod";
import { env } from "@/data/env/server";
import type { Cookies } from "@/features/core/auth/types";

const STATE_COOKIE_KEY = "zoomConnectState";
const COOKIE_EXPIRATION_SECONDS = 60 * 10;

const stateCookieSchema = z.object({
  state: z.string().min(1),
  zoomClientId: z.uuid(),
});

/**
 * The `state` round trip that stops a third party from feeding us an
 * authorization code for *their* Zoom account. Mirrors the auth OAuth
 * client's state cookie (features/core/auth/core/oauth/base.ts), with the
 * client row id kept in the cookie rather than in the state parameter — the
 * value that comes back from Zoom is only ever compared, never trusted as
 * input, so a forged state can't point the handshake at another org's row.
 */
export function createZoomConnectState(
  cookies: Pick<Cookies, "set">,
  zoomClientId: string,
): string {
  const state = crypto.randomBytes(32).toString("hex");

  cookies.set(STATE_COOKIE_KEY, JSON.stringify({ state, zoomClientId }), {
    // Matches session.ts's policy: `secure: true` unconditionally would
    // stop the cookie being written on the http://localhost dev flow.
    secure: env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    expires: new Date(Date.now() + COOKIE_EXPIRATION_SECONDS * 1000),
  });

  return state;
}

export function clearZoomConnectState(cookies: Pick<Cookies, "delete">): void {
  cookies.delete(STATE_COOKIE_KEY);
}

/** Returns the pending client id, or null when the state doesn't check out. */
export function consumeZoomConnectState(
  cookies: Cookies,
  returnedState: string,
): string | null {
  const raw = cookies.get(STATE_COOKIE_KEY)?.value;
  cookies.delete(STATE_COOKIE_KEY);
  if (!raw) return null;

  const parsed = safeParseStateCookie(raw);
  if (!parsed) return null;

  return timingSafeEquals(parsed.state, returnedState)
    ? parsed.zoomClientId
    : null;
}

function safeParseStateCookie(raw: string) {
  try {
    const result = stateCookieSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function timingSafeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}
