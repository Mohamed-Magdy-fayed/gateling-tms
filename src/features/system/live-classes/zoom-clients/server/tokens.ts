import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/drizzle";
import { ZoomClientsTable } from "@/drizzle/schema";
import {
  decryptToken,
  encryptToken,
  needsRefresh,
  refreshAccessToken,
} from "@/integrations/zoom";
import { getZoomConfig } from "./config";

export class ZoomClientNotConnectedError extends Error {
  constructor() {
    super("Zoom client is not connected.");
  }
}

export function readAccessToken(
  encryptedAccessToken: string,
  encryptionKey: string,
): string {
  return decryptToken(encryptedAccessToken, encryptionKey);
}

/**
 * The single way the rest of the app gets a usable Zoom access token.
 * Refreshes and persists when the stored one is close to expiring — Zoom
 * rotates the refresh token on every refresh and invalidates the previous
 * one, so the new pair must be written back or the connection dies on the
 * next call.
 */
export async function getValidZoomAccessToken(
  organizationId: string,
  zoomClientId: string,
  now = new Date(),
): Promise<string> {
  const { credentials, encryptionKey } = getZoomConfig();

  const zoomClient = await db.query.ZoomClientsTable.findFirst({
    where: and(
      eq(ZoomClientsTable.id, zoomClientId),
      eq(ZoomClientsTable.organizationId, organizationId),
      isNull(ZoomClientsTable.deletedAt),
    ),
    columns: {
      id: true,
      status: true,
      accessToken: true,
      refreshToken: true,
      accessTokenExpiresAt: true,
    },
  });

  if (
    zoomClient?.status !== "active" ||
    !zoomClient.accessToken ||
    !zoomClient.refreshToken
  ) {
    throw new ZoomClientNotConnectedError();
  }

  if (!needsRefresh(zoomClient.accessTokenExpiresAt, now)) {
    return decryptToken(zoomClient.accessToken, encryptionKey);
  }

  const tokens = await refreshAccessToken(
    credentials,
    decryptToken(zoomClient.refreshToken, encryptionKey),
  );

  await db
    .update(ZoomClientsTable)
    .set({
      accessToken: encryptToken(tokens.accessToken, encryptionKey),
      refreshToken: encryptToken(tokens.refreshToken, encryptionKey),
      accessTokenExpiresAt: tokens.expiresAt,
      status: "active",
      lastError: null,
    })
    .where(
      and(
        eq(ZoomClientsTable.id, zoomClient.id),
        eq(ZoomClientsTable.organizationId, organizationId),
      ),
    );

  return tokens.accessToken;
}
