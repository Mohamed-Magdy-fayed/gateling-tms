import { eq } from "drizzle-orm";
import { db } from "@/drizzle";
import { GoogleIntegrationsTable } from "@/drizzle/schema";
import { refreshAccessToken } from "@/integrations/google";
import { needsRefresh } from "@/integrations/oauth/expiry";
import { decryptToken, encryptToken } from "@/integrations/oauth/token-crypto";
import { getGoogleImportConfig } from "./config";
import { recordGoogleIntegrationFailure } from "./mutations";

export class GoogleNotConnectedError extends Error {
  constructor() {
    super("This organization has no Google account connected.");
  }
}

/**
 * The single way the rest of the app gets a usable Google access token.
 *
 * Deliberately simpler than `getValidZoomAccessToken`: Zoom rotates the
 * refresh token on every refresh and invalidates the previous one, which makes
 * concurrent refreshes destructive and forces an advisory lock. Google keeps
 * the refresh token stable and returns no new one, so two callers refreshing
 * at once both get a valid access token and the last write simply wins —
 * nothing is invalidated, so there is nothing to serialize.
 *
 * A refusal marks the integration `error` with the reason, so the settings
 * page can tell the admins to reconnect rather than the import failing with
 * no explanation anywhere.
 */
export async function getValidGoogleAccessToken(
  organizationId: string,
  now = new Date(),
): Promise<string> {
  const { credentials, encryptionKey } = getGoogleImportConfig();

  const integration = await db.query.GoogleIntegrationsTable.findFirst({
    where: eq(GoogleIntegrationsTable.organizationId, organizationId),
    columns: {
      id: true,
      accessToken: true,
      refreshToken: true,
      expiresAt: true,
    },
  });

  if (!integration) throw new GoogleNotConnectedError();

  if (!needsRefresh(integration.expiresAt, now)) {
    return decryptToken(integration.accessToken, encryptionKey);
  }

  try {
    const tokens = await refreshAccessToken(
      credentials,
      decryptToken(integration.refreshToken, encryptionKey),
    );

    await db
      .update(GoogleIntegrationsTable)
      .set({
        accessToken: encryptToken(tokens.accessToken, encryptionKey),
        expiresAt: tokens.expiresAt,
        status: "active",
        lastError: null,
      })
      .where(eq(GoogleIntegrationsTable.organizationId, organizationId));

    return tokens.accessToken;
  } catch (error) {
    await recordGoogleIntegrationFailure({ organizationId, error });
    throw error;
  }
}
