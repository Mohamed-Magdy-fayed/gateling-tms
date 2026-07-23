import type { PartialUser } from "@/features/core/auth/types";

export function isSafeReturnTo(
  returnTo: string | undefined,
): returnTo is string {
  if (!returnTo) return false;
  if (!returnTo.startsWith("/")) return false;
  if (returnTo.startsWith("//") || returnTo.startsWith("/\\")) return false;
  return true;
}

/**
 * Org-awareness for the unverified/verified split lives here; whether an
 * *authed-and-verified* user without an org gets bounced to onboarding is
 * `src/proxy.ts`'s job instead (phase-02 step 6), not this function's.
 */
export function getPostAuthRedirect(user: PartialUser, returnTo?: string) {
  if (!user.emailVerifiedAt) {
    // `returnTo` would otherwise be silently dropped here — e.g. an invite
    // link (`/invite/<token>`) that routed a brand-new visitor through
    // sign-up. Carry it through as a query param so the verify-email page
    // can send them back to finish what they started once verified,
    // instead of stranding them logged in with nowhere to go (STATE.md D49).
    if (isSafeReturnTo(returnTo)) {
      return `/auth/verify-email?returnTo=${encodeURIComponent(returnTo)}`;
    }
    return "/auth/verify-email";
  }
  if (isSafeReturnTo(returnTo)) return returnTo;
  return "/";
}
