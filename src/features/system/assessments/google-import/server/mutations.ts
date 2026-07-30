import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { db } from "@/drizzle";
import { GoogleIntegrationsTable } from "@/drizzle/schema";
import {
  exchangeAuthorizationCode,
  fetchGoogleAccount,
  GOOGLE_FORMS_SCOPE,
} from "@/integrations/google";
import { inngest } from "@/integrations/inngest/client";
import { googleIntegrationDisconnectedEvent } from "@/integrations/inngest/functions/on-google-integration-disconnected";
import { encryptToken } from "@/integrations/oauth/token-crypto";
import { getGoogleImportConfig } from "./config";
import type { OrgTRPCContext } from "./types";

const MAX_STORED_ERROR_LENGTH = 512;

/**
 * Google issued a grant with no refresh token — it only mints one on a fresh
 * consent, so an account that already granted this app and wasn't re-prompted
 * comes back without one. Storing it anyway would produce a connection that
 * looks healthy and dies silently within the hour.
 */
export class GoogleRefreshTokenMissingError extends Error {}

/** The account approved sign-in but deselected the Forms permission. */
export class GoogleFormsScopeMissingError extends Error {}

/**
 * Second half of the OAuth handshake, called by the callback route once it has
 * validated the state cookie. Kept here (not in the route) so the org scoping
 * and the token encryption live with every other write to this table.
 *
 * Upserts on `organizationId`: an org has exactly one Google grant, and
 * reconnecting (to fix an expired grant, or to point at a different Google
 * account) has to replace it rather than fail on the unique index.
 */
export async function completeGoogleConnection({
  organizationId,
  code,
  actorEmail,
}: {
  organizationId: string;
  code: string;
  actorEmail: string;
}) {
  const { credentials, encryptionKey } = getGoogleImportConfig();
  const tokens = await exchangeAuthorizationCode(credentials, code);

  if (!tokens.refreshToken) {
    throw new GoogleRefreshTokenMissingError(
      "Google returned no refresh token for this grant.",
    );
  }

  if (!tokens.scope.split(" ").includes(GOOGLE_FORMS_SCOPE)) {
    throw new GoogleFormsScopeMissingError(
      "The Google account did not grant access to its forms.",
    );
  }

  const account = await fetchGoogleAccount(tokens.accessToken);

  const values = {
    accessToken: encryptToken(tokens.accessToken, encryptionKey),
    refreshToken: encryptToken(tokens.refreshToken, encryptionKey),
    scope: tokens.scope,
    expiresAt: tokens.expiresAt,
    status: "active" as const,
    googleEmail: account.email,
    googleUserId: account.userId,
    lastError: null,
  };

  const [integration] = await db
    .insert(GoogleIntegrationsTable)
    .values({ ...values, organizationId, createdBy: actorEmail })
    .onConflictDoUpdate({
      target: GoogleIntegrationsTable.organizationId,
      set: { ...values, updatedBy: actorEmail },
    })
    .returning({ id: GoogleIntegrationsTable.id });

  if (!integration) {
    throw new Error("Failed to store the Google connection.");
  }

  return integration;
}

/**
 * Deletes the row and hands the "tell Google to forget this grant" call to
 * Inngest — an external HTTP round trip the admin shouldn't wait on, and one
 * worth retrying if Google is down (docs/inngest-offload-policy.md).
 *
 * A hard delete, unlike Zoom's soft delete: this table holds nothing but the
 * credential itself, so there is no history worth keeping once the grant is
 * gone, and one-row-per-org means a tombstone would only get in the upsert's
 * way on the next connect.
 */
export async function disconnectGoogleIntegration(ctx: OrgTRPCContext) {
  const [deleted] = await ctx.db
    .delete(GoogleIntegrationsTable)
    .where(eq(GoogleIntegrationsTable.organizationId, ctx.organizationId))
    .returning({
      id: GoogleIntegrationsTable.id,
      accessToken: GoogleIntegrationsTable.accessToken,
    });

  if (!deleted) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  await requestTokenRevocation(ctx.organizationId, deleted.accessToken);

  return { id: deleted.id };
}

/**
 * Leaves the row in place with the reason attached rather than deleting it —
 * the org needs to see *that* something failed, and the page reads `status`
 * and `lastError` to say so instead of still showing "Connected".
 */
export async function recordGoogleIntegrationFailure({
  organizationId,
  error,
}: {
  organizationId: string;
  error: unknown;
}) {
  const message =
    error instanceof Error ? error.message : "Google connection failed.";

  await db
    .update(GoogleIntegrationsTable)
    .set({
      status: "error",
      lastError: message.slice(0, MAX_STORED_ERROR_LENGTH),
    })
    .where(eq(GoogleIntegrationsTable.organizationId, organizationId));
}

/**
 * The disconnect itself has already succeeded by this point, so a failed
 * enqueue is logged rather than thrown — telling the admin their disconnect
 * failed would be untrue, and the credentials are already gone from the row.
 */
async function requestTokenRevocation(
  organizationId: string,
  encryptedAccessToken: string,
) {
  try {
    await inngest.send(
      googleIntegrationDisconnectedEvent.create({
        organizationId,
        encryptedAccessToken,
      }),
    );
  } catch (error) {
    console.error("Failed to enqueue Google token revocation", error);
  }
}
