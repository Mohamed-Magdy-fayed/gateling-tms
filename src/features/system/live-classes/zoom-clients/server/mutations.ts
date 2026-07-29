import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/drizzle";
import { ZoomClientsTable } from "@/drizzle/schema";
import { inngest } from "@/integrations/inngest/client";
import { zoomClientDisconnectedEvent } from "@/integrations/inngest/functions/on-zoom-client-disconnected";
import {
  encryptToken,
  exchangeAuthorizationCode,
  fetchZoomAccount,
} from "@/integrations/zoom";
import { getZoomConfig, isZoomConfigured } from "./config";
import type {
  ZoomClientIdInput,
  ZoomClientMutationInput,
  ZoomClientUpdateInput,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

const MAX_STORED_ERROR_LENGTH = 512;

/**
 * Creates the row in `pending` and hands back its id. The browser then goes
 * to `/api/zoom/connect/[id]`, which is what actually sets the anti-CSRF
 * state cookie and redirects to Zoom — a tRPC mutation can't own that
 * handshake because the cookie has to travel with the redirect itself.
 */
export async function createZoomClient(
  ctx: OrgTRPCContext,
  input: ZoomClientMutationInput,
) {
  assertZoomConfigured(ctx);

  const [zoomClient] = await ctx.db
    .insert(ZoomClientsTable)
    .values({
      organizationId: ctx.organizationId,
      name: input.name,
      status: "pending",
      createdBy: actorLabel(ctx),
    })
    .returning({ id: ZoomClientsTable.id });

  if (!zoomClient) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: ctx.t("errors.generic"),
    });
  }

  return zoomClient;
}

export async function updateZoomClient(
  ctx: OrgTRPCContext,
  input: ZoomClientUpdateInput,
) {
  const [updated] = await ctx.db
    .update(ZoomClientsTable)
    .set({ name: input.name, updatedBy: actorLabel(ctx) })
    .where(scopedTo(ctx, input.id))
    .returning({ id: ZoomClientsTable.id });

  if (!updated) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return updated;
}

/**
 * Soft-deletes the row, clears its credentials, and hands the "tell Zoom to
 * forget this grant" call to Inngest — an external HTTP round trip the admin
 * shouldn't wait on, and one worth retrying if Zoom is down
 * (docs/inngest-offload-policy.md).
 */
export async function disconnectZoomClient(
  ctx: OrgTRPCContext,
  input: ZoomClientIdInput,
) {
  // UPDATE ... RETURNING hands back the *new* values, so the token has to be
  // read before it is cleared or there would be nothing left to revoke.
  const [zoomClient] = await ctx.db
    .update(ZoomClientsTable)
    .set({
      deletedAt: new Date(),
      deletedBy: actorLabel(ctx),
      status: "pending",
    })
    .where(scopedTo(ctx, input.id))
    .returning({
      id: ZoomClientsTable.id,
      accessToken: ZoomClientsTable.accessToken,
    });

  if (!zoomClient) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  // Cleared in a second write so no readable credential outlives the
  // disconnect, even if the revoke below never reaches Zoom.
  await ctx.db
    .update(ZoomClientsTable)
    .set({
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
    })
    .where(
      and(
        eq(ZoomClientsTable.id, zoomClient.id),
        eq(ZoomClientsTable.organizationId, ctx.organizationId),
      ),
    );

  await requestTokenRevocation(ctx, zoomClient.id, zoomClient.accessToken);

  return { id: zoomClient.id };
}

/**
 * Second half of the OAuth handshake, called by the callback route once it
 * has validated the state cookie. Kept here (not in the route) so the org
 * scoping and the token encryption live with every other write to this table.
 */
export async function completeZoomConnection({
  organizationId,
  zoomClientId,
  code,
  actorEmail,
}: {
  organizationId: string;
  zoomClientId: string;
  code: string;
  actorEmail: string;
}) {
  const { credentials, encryptionKey } = getZoomConfig();

  try {
    const tokens = await exchangeAuthorizationCode(credentials, code);
    const account = await fetchZoomAccount(tokens.accessToken);

    const [updated] = await db
      .update(ZoomClientsTable)
      .set({
        status: "active",
        zoomUserId: account.userId,
        zoomAccountId: account.accountId,
        zoomEmail: account.email,
        accessToken: encryptToken(tokens.accessToken, encryptionKey),
        refreshToken: encryptToken(tokens.refreshToken, encryptionKey),
        accessTokenExpiresAt: tokens.expiresAt,
        lastError: null,
        updatedBy: actorEmail,
      })
      .where(
        and(
          eq(ZoomClientsTable.id, zoomClientId),
          eq(ZoomClientsTable.organizationId, organizationId),
          isNull(ZoomClientsTable.deletedAt),
        ),
      )
      .returning({ id: ZoomClientsTable.id });

    if (!updated)
      throw new Error("Zoom client row is gone or not in this org.");

    return updated;
  } catch (error) {
    await recordZoomConnectionFailure({
      organizationId,
      zoomClientId,
      error,
    });
    throw error;
  }
}

/**
 * A failed handshake leaves the row visible with the reason attached rather
 * than deleting it — the org needs to see *that* connecting failed, and can
 * retry the same row.
 */
export async function recordZoomConnectionFailure({
  organizationId,
  zoomClientId,
  error,
}: {
  organizationId: string;
  zoomClientId: string;
  error: unknown;
}) {
  const message =
    error instanceof Error ? error.message : "Zoom connection failed.";

  await db
    .update(ZoomClientsTable)
    .set({
      status: "error",
      lastError: message.slice(0, MAX_STORED_ERROR_LENGTH),
    })
    .where(
      and(
        eq(ZoomClientsTable.id, zoomClientId),
        eq(ZoomClientsTable.organizationId, organizationId),
        isNull(ZoomClientsTable.deletedAt),
      ),
    );
}

function scopedTo(ctx: OrgTRPCContext, id: string) {
  return and(
    eq(ZoomClientsTable.id, id),
    eq(ZoomClientsTable.organizationId, ctx.organizationId),
    isNull(ZoomClientsTable.deletedAt),
  );
}

/** Matches the audit columns' convention elsewhere (STATE.md D62). */
function actorLabel(ctx: OrgTRPCContext) {
  return ctx.session?.user.email ?? ctx.session?.user.id ?? "system";
}

function assertZoomConfigured(ctx: OrgTRPCContext) {
  if (isZoomConfigured()) return;

  throw new TRPCError({
    code: "PRECONDITION_FAILED",
    message: ctx.t("zoomClients.errors.notConfigured"),
  });
}

/**
 * The disconnect itself has already succeeded by this point, so a failed
 * enqueue is logged rather than thrown — telling the admin their disconnect
 * failed would be untrue, and the credentials are already gone from the row.
 */
async function requestTokenRevocation(
  ctx: OrgTRPCContext,
  zoomClientId: string,
  encryptedAccessToken: string | null,
) {
  if (!encryptedAccessToken) return;

  try {
    await inngest.send(
      zoomClientDisconnectedEvent.create({
        organizationId: ctx.organizationId,
        zoomClientId,
        encryptedAccessToken,
      }),
    );
  } catch (error) {
    console.error("Failed to enqueue Zoom token revocation", error);
  }
}
