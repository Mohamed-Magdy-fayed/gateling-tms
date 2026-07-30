import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveOrgAccessFromSession } from "@/features/core/organizations/server";
import { buildGoogleImportUrl } from "@/features/system/assessments/google-import/lib/redirect-codes";
import {
  getGoogleImportConfig,
  isGoogleImportConfigured,
} from "@/features/system/assessments/google-import/server";
import { createGoogleConnectState } from "@/features/system/assessments/google-import/server/connect-state";
import { buildAuthorizeUrl } from "@/integrations/google";

/**
 * Starts the Google OAuth handshake that grants this organization read access
 * to a Google account's forms.
 *
 * A route handler rather than a tRPC mutation because the anti-CSRF state
 * cookie has to be set on the very response that redirects to Google.
 * Everything a tRPC call would enforce is re-applied here by hand: session,
 * active organization, and admin role.
 *
 * No row is created up front (unlike Zoom's connect route): an org has exactly
 * one Google grant, so there is nothing to identify — the callback writes the
 * row for whichever org the session is active in.
 */
export async function GET() {
  if (!isGoogleImportConfigured()) {
    redirect(buildGoogleImportUrl("not_configured"));
  }

  const cookieJar = await cookies();
  const access = await resolveOrgAccessFromSession(cookieJar);
  if (access?.role !== "admin") {
    redirect(buildGoogleImportUrl("forbidden"));
  }

  const { credentials } = getGoogleImportConfig();
  const state = createGoogleConnectState(cookieJar);

  redirect(buildAuthorizeUrl(credentials, state));
}
