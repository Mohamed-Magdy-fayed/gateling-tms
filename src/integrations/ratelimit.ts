import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { headers } from "next/headers";

import { normalizeEmail } from "@/features/core/auth/core/helpers";
import { redisClient } from "@/integrations/redis";

/**
 * One limiter per auth endpoint so a burst on one flow (e.g. password-reset
 * OTP guessing) can't be worked around by hitting a different endpoint that
 * shares a budget.
 */
export const signInRatelimit = new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(10, "5 m"),
  prefix: "ratelimit:sign-in",
});

export const signUpRatelimit = new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(5, "60 m"),
  prefix: "ratelimit:sign-up",
});

export const passwordResetRequestRatelimit = new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(5, "60 m"),
  prefix: "ratelimit:password-reset-request",
});

// Tighter window than the request limiter above — a 6-digit OTP has only
// 1,000,000 combinations, so submission attempts need a stricter budget than
// requesting a fresh code does.
export const passwordResetSubmitRatelimit = new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(10, "15 m"),
  prefix: "ratelimit:password-reset-submit",
});

// Shared by begin + complete passkey authentication — they're one logical
// attempt from the caller's perspective, so they draw from the same budget.
export const passkeyAuthRatelimit = new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(10, "5 m"),
  prefix: "ratelimit:passkey-auth",
});

// The public /contact form is unauthenticated, so it needs its own budget
// separate from the auth flows above. Two limiters, both checked: per
// IP+email (tight — a real visitor doesn't resubmit often) and per IP alone
// (looser, but independent of the email field — an IP+email-only key lets a
// spammer submit unlimited messages by rotating email addresses, since the
// key changes every time).
export const contactFormRatelimit = new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(5, "60 m"),
  prefix: "ratelimit:contact-form",
});

export const contactFormIpRatelimit = new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(20, "60 m"),
  prefix: "ratelimit:contact-form-ip",
});

/**
 * Trusts `x-forwarded-for`/`x-real-ip` as set by the platform's own edge
 * network (per `06-workflow.md` §5, this app deploys on Vercel) — Vercel's
 * routing layer overwrites these headers with the real client IP before a
 * request reaches the function, so a client can't spoof them in practice.
 * This assumption does NOT hold if the app is ever run directly behind an
 * untrusted/arbitrary reverse proxy; revisit if the hosting target changes
 * (D14).
 */
export async function getRequestIp() {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return headerList.get("x-real-ip") || "unknown";
}

export function buildRatelimitKey(ip: string, email: string) {
  return `${ip}:${normalizeEmail(email)}`;
}

/** Returns true when the caller has exceeded the limiter's budget. */
export async function isRateLimited(limiter: Ratelimit, identifier: string) {
  const { success } = await limiter.limit(identifier);
  return !success;
}
