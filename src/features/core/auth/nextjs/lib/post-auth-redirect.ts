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
 * Org-unaware for now — organizations/orgProcedure (phase-02 step 5) and the
 * onboarding wizard (step 7) don't exist yet on this branch. Once they land,
 * an authed-but-orgless user should redirect to onboarding instead of `/`;
 * `src/proxy.ts` (step 6) is where that gating actually belongs.
 */
export function getPostAuthRedirect(user: PartialUser, returnTo?: string) {
  if (!user.emailVerifiedAt) return "/auth/verify-email";
  if (isSafeReturnTo(returnTo)) return returnTo;
  return "/";
}
