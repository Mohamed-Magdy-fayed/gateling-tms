import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { resolveOrgAccessFromSession } from "@/features/core/organizations/server";
import {
  buildGoogleImportUrl,
  type GoogleConnectResultCode,
} from "@/features/system/assessments/google-import/lib/redirect-codes";
import {
  completeGoogleConnection,
  GoogleFormsScopeMissingError,
  GoogleRefreshTokenMissingError,
  isGoogleImportConfigured,
} from "@/features/system/assessments/google-import/server";
import {
  clearGoogleConnectState,
  consumeGoogleConnectState,
} from "@/features/system/assessments/google-import/server/connect-state";

/**
 * Where Google sends the org's admin back after they approve (or refuse) the
 * grant. Registered as an authorized redirect URI on the Cloud OAuth client —
 * see docs/integrations-google.md.
 */
export async function GET(request: NextRequest) {
  const cookieJar = await cookies();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  // Google sends `error=access_denied` when the admin refuses the consent
  // screen — an ordinary outcome, not a failure to report as broken.
  if (request.nextUrl.searchParams.get("error")) {
    clearGoogleConnectState(cookieJar);
    redirect(buildGoogleImportUrl("denied"));
  }

  // Every early exit clears the cookie: a state left behind is a nonce this
  // browser could still present on a later, unrelated callback.
  if (!code || !state) {
    clearGoogleConnectState(cookieJar);
    redirect(buildGoogleImportUrl("invalid_state"));
  }
  if (!isGoogleImportConfigured()) {
    clearGoogleConnectState(cookieJar);
    redirect(buildGoogleImportUrl("not_configured"));
  }

  const organizationId = consumeGoogleConnectState(cookieJar, state);
  if (!organizationId) {
    redirect(buildGoogleImportUrl("invalid_state"));
  }

  // The state cookie proves this browser started the handshake and says which
  // organization it started for; the session still has to prove the caller
  // administers *that* organization — the two are checked independently on
  // purpose. Switching the active organization in another tab mid-consent
  // therefore refuses the callback rather than writing the grant to the wrong
  // organization.
  const access = await resolveOrgAccessFromSession(cookieJar);
  if (access?.role !== "admin" || access.organizationId !== organizationId) {
    redirect(buildGoogleImportUrl("forbidden"));
  }

  let result: GoogleConnectResultCode = "connected";

  try {
    await completeGoogleConnection({
      organizationId,
      code,
      actorEmail: access.userEmail ?? access.userId,
    });
  } catch (error) {
    // Only a fixed code reaches the browser; the reason is logged here (see
    // redirect-codes.ts). The two named cases are worth their own code because
    // each has a specific fix the admin can act on.
    console.error("Google connection failed", error);
    if (error instanceof GoogleRefreshTokenMissingError) {
      result = "no_refresh_token";
    } else if (error instanceof GoogleFormsScopeMissingError) {
      result = "missing_scope";
    } else {
      result = "connect_failed";
    }
  }

  redirect(buildGoogleImportUrl(result));
}
