import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/drizzle";
import { ZoomClientsTable } from "@/drizzle/schema";
import {
  decryptToken,
  encryptToken,
  needsRefresh,
  refreshAccessToken,
} from "@/integrations/zoom";
import { getZoomConfig } from "./config";
import { recordZoomClientFailure } from "./mutations";

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

type ConnectedZoomClient = {
  id: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date | null;
};

/**
 * The single way the rest of the app gets a usable Zoom access token.
 *
 * Refreshes when the stored one is close to expiring. Zoom rotates the
 * refresh token on every refresh and invalidates the previous one, which
 * makes an unsynchronized read → refresh → write sequence genuinely
 * destructive: two concurrent callers would both send the same refresh token,
 * the loser would be rejected by Zoom, and the connection would be dead until
 * an admin reconnected by hand. The refresh is therefore serialized per
 * client with an advisory lock, and the decision to refresh is re-taken
 * *inside* the lock so the second caller uses what the first just wrote
 * instead of refreshing again.
 *
 * The lock is held across the call to Zoom — deliberately. It only serializes
 * one org's one Zoom account, the call is bounded by the API client's 10s
 * timeout, and the alternative (concurrent rotation) breaks the connection
 * permanently rather than briefly queueing it.
 */
export async function getValidZoomAccessToken(
  organizationId: string,
  zoomClientId: string,
  now = new Date(),
): Promise<string> {
  const { credentials, encryptionKey } = getZoomConfig();

  // Fast path, unlocked: the overwhelmingly common case is a token with
  // plenty of life left, and that needs no coordination at all.
  const current = await loadConnectedClient(db, organizationId, zoomClientId);
  if (!needsRefresh(current.accessTokenExpiresAt, now)) {
    return decryptToken(current.accessToken, encryptionKey);
  }

  try {
    return await db.transaction(async (trx) => {
      // Serializes per client; released at commit — same idiom as
      // on-group-schedule-changed.ts.
      await trx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtextextended(${zoomClientId}, 0))`,
      );

      // Re-read under the lock, never reuse the pre-lock snapshot: a
      // concurrent caller may have refreshed while this one waited, and
      // sending that superseded refresh token to Zoom is what kills the
      // connection.
      const locked = await loadConnectedClient(
        trx,
        organizationId,
        zoomClientId,
      );

      if (!needsRefresh(locked.accessTokenExpiresAt, now)) {
        return decryptToken(locked.accessToken, encryptionKey);
      }

      const tokens = await refreshAccessToken(
        credentials,
        decryptToken(locked.refreshToken, encryptionKey),
      );

      await trx
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
            eq(ZoomClientsTable.id, locked.id),
            eq(ZoomClientsTable.organizationId, organizationId),
          ),
        );

      return tokens.accessToken;
    });
  } catch (error) {
    // Recorded after the transaction has rolled back, so the reason survives
    // instead of being rolled back with it. A refused refresh means the
    // connection needs an admin's attention, and the page reads `status` and
    // `lastError` to say so — silently rethrowing would leave it showing
    // "Connected".
    await recordZoomClientFailure({ organizationId, zoomClientId, error });
    throw error;
  }
}

async function loadConnectedClient(
  runner: Pick<typeof db, "query">,
  organizationId: string,
  zoomClientId: string,
): Promise<ConnectedZoomClient> {
  const zoomClient = await runner.query.ZoomClientsTable.findFirst({
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

  return {
    id: zoomClient.id,
    accessToken: zoomClient.accessToken,
    refreshToken: zoomClient.refreshToken,
    accessTokenExpiresAt: zoomClient.accessTokenExpiresAt,
  };
}
