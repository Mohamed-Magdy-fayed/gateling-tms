import { and, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/drizzle";
import { ZoomClientsTable } from "@/drizzle/schema";
import { resolveOrgAccessFromSession } from "@/features/core/organizations/server";
import { buildZoomClientsUrl } from "@/features/system/live-classes/zoom-clients/lib/redirect-codes";
import {
  getZoomConfig,
  isZoomConfigured,
} from "@/features/system/live-classes/zoom-clients/server";
import { createZoomConnectState } from "@/features/system/live-classes/zoom-clients/server/connect-state";
import { buildAuthorizeUrl } from "@/integrations/zoom";

/**
 * Starts the Zoom OAuth handshake for one pending `zoom_clients` row.
 *
 * A route handler rather than a tRPC mutation because the anti-CSRF state
 * cookie has to be set on the very response that redirects to Zoom.
 * Everything a tRPC call would enforce is re-applied here by hand: session,
 * active organization, admin role, and that the row belongs to that org.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const zoomClientId = z.uuid().safeParse(id);
  if (!zoomClientId.success) redirect(buildZoomClientsUrl("connect_failed"));

  if (!isZoomConfigured()) redirect(buildZoomClientsUrl("not_configured"));

  const cookieJar = await cookies();
  const access = await resolveOrgAccessFromSession(cookieJar);
  if (access?.role !== "admin") {
    redirect(buildZoomClientsUrl("forbidden"));
  }

  const zoomClient = await db.query.ZoomClientsTable.findFirst({
    where: and(
      eq(ZoomClientsTable.id, zoomClientId.data),
      eq(ZoomClientsTable.organizationId, access.organizationId),
      isNull(ZoomClientsTable.deletedAt),
    ),
    columns: { id: true },
  });

  if (!zoomClient) redirect(buildZoomClientsUrl("connect_failed"));

  const { credentials } = getZoomConfig();
  const state = createZoomConnectState(cookieJar, zoomClient.id);

  // Scopes aren't part of this URL — a Zoom OAuth app grants whatever its
  // marketplace configuration lists (docs/integrations-zoom.md).
  redirect(buildAuthorizeUrl(credentials, state));
}
