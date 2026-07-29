import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { resolveOrgAccessFromSession } from "@/features/core/organizations/server";
import { buildZoomClientsUrl } from "@/features/system/live-classes/zoom-clients/lib/redirect-codes";
import {
  completeZoomConnection,
  isZoomConfigured,
} from "@/features/system/live-classes/zoom-clients/server";
import {
  clearZoomConnectState,
  consumeZoomConnectState,
} from "@/features/system/live-classes/zoom-clients/server/connect-state";
import { inngest } from "@/integrations/inngest/client";
import { organizationZoomConnectedEvent } from "@/integrations/inngest/functions/on-organization-zoom-connected";

/**
 * Where Zoom sends the org's admin back after they approve (or refuse) the
 * connection. Registered as the app's OAuth redirect URL — see
 * docs/integrations-zoom.md.
 */
export async function GET(request: NextRequest) {
  const cookieJar = await cookies();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  // Zoom sends `error=access_denied` when the admin refuses the consent
  // screen — an ordinary outcome, not a failure to report as broken.
  if (request.nextUrl.searchParams.get("error")) {
    clearZoomConnectState(cookieJar);
    redirect(buildZoomClientsUrl("denied"));
  }

  if (!code || !state) redirect(buildZoomClientsUrl("invalid_state"));
  if (!isZoomConfigured()) redirect(buildZoomClientsUrl("not_configured"));

  const zoomClientId = consumeZoomConnectState(cookieJar, state);
  if (!zoomClientId) redirect(buildZoomClientsUrl("invalid_state"));

  // The state cookie proves this browser started the handshake; the session
  // still has to prove the caller is an admin of the org that owns the row —
  // the two are checked independently on purpose.
  const access = await resolveOrgAccessFromSession(cookieJar);
  if (access?.role !== "admin") {
    redirect(buildZoomClientsUrl("forbidden"));
  }

  let didFail = false;

  try {
    await completeZoomConnection({
      organizationId: access.organizationId,
      zoomClientId,
      code,
      actorEmail: access.userEmail ?? access.userId,
    });
    await requestPendingMeetingProvisioning(access.organizationId);
  } catch (error) {
    // Only a fixed code reaches the browser; the reason is logged here and
    // stored on the row for the org's admins (see redirect-codes.ts).
    console.error("Zoom connection failed", error);
    didFail = true;
  }

  redirect(buildZoomClientsUrl(didFail ? "connect_failed" : "connected"));
}

/**
 * Groups scheduled before this connection existed have sessions with no
 * meeting; connecting is the moment they can get one, and nobody should have
 * to re-save every group's schedule to trigger it.
 *
 * Swallows its own failures: the connection itself already succeeded, so a
 * queue hiccup must not report it as broken. The catch-up runs again on the
 * next connect or schedule edit.
 */
async function requestPendingMeetingProvisioning(organizationId: string) {
  try {
    await inngest.send(
      organizationZoomConnectedEvent.create({ organizationId }),
    );
  } catch (error) {
    console.error("Failed to enqueue organization/zoom-connected", {
      organizationId,
      error,
    });
  }
}
