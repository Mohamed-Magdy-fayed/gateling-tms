import { TRPCError } from "@trpc/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { MeetingAccountsTable } from "@/drizzle/schema";
import { encryptToken } from "@/integrations/oauth/token-crypto";
import {
  listRooms,
  OnMeetingApiError,
  requestAccessToken,
  requestApiKeys,
} from "@/integrations/onmeeting";
import {
  isRateLimited,
  onMeetingConnectRatelimit,
} from "@/integrations/ratelimit";
import {
  getCredentialsEncryptionKey,
  OnMeetingNotConfiguredError,
} from "./config";
import type {
  ConnectMeetingAccountInput,
  MeetingAccountIdInput,
  RenameMeetingAccountInput,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

/**
 * Signs in to onMeeting once and records the account's rooms.
 *
 * The password lives only in this function's arguments and the single
 * `requestApiKeys` call it makes. It is never written to a column, a log line,
 * or a thrown message — `translateOnMeetingError` maps provider failures onto
 * this app's own copy precisely so nothing from that exchange can echo back
 * out (STATE.md D146).
 *
 * One row per room, not one per account: a room hosts one live meeting at a
 * time, so rooms are the unit of concurrent capacity (D143).
 */
export async function connectMeetingAccount(
  ctx: OrgTRPCContext,
  input: ConnectMeetingAccountInput,
) {
  // Checked before anything reaches onMeeting, so a rate-limited caller can't
  // use this endpoint to probe passwords against someone else's sign-in.
  if (await isRateLimited(onMeetingConnectRatelimit, ctx.organizationId)) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: ctx.t("meetingAccounts.errors.rateLimited"),
    });
  }

  const encryptionKey = resolveEncryptionKey(ctx);

  let credentials: Awaited<ReturnType<typeof requestApiKeys>>;
  let rooms: Awaited<ReturnType<typeof listRooms>>;
  try {
    credentials = await requestApiKeys(input.email, input.password);
    const token = await requestAccessToken(credentials);
    rooms = await listRooms(token);
  } catch (error) {
    throw translateOnMeetingError(ctx, error);
  }

  // An onMeeting account with no room can't host anything, so connecting it
  // would record credentials that no session could ever use.
  if (rooms.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: ctx.t("meetingAccounts.errors.noRooms"),
    });
  }

  const actor = actorLabel(ctx);
  const apiKey = encryptToken(credentials.apiKey, encryptionKey);
  const apiSecret = encryptToken(credentials.apiSecret, encryptionKey);

  // One transaction: a partial connect would leave some rooms usable and
  // others invisible, with no way for the admin to tell which.
  //
  // An **upsert**, not a plain insert. Connecting the same onMeeting account
  // twice is ordinary — a retry after a network blip, a rotated password, a
  // second admin doing what the first already did — and each of those must
  // refresh the room it already has. Inserting again would double the org's
  // apparent concurrent capacity while leaving half its sessions bound to
  // credentials this call just superseded. The conflict target is the partial
  // unique index on (organizationId, roomCode) over live rows.
  const written = await ctx.db.transaction(async (tx) =>
    tx
      .insert(MeetingAccountsTable)
      .values(
        rooms.map((room) => ({
          organizationId: ctx.organizationId,
          name: `${input.name} — ${room.roomName}`.slice(0, 256),
          status: "active" as const,
          accountId: credentials.accountId,
          roomCode: room.roomCode,
          roomName: room.roomName,
          apiKey,
          apiSecret,
          createdBy: actor,
          updatedBy: actor,
        })),
      )
      .onConflictDoUpdate({
        target: [
          MeetingAccountsTable.organizationId,
          MeetingAccountsTable.roomCode,
        ],
        targetWhere: isNull(MeetingAccountsTable.deletedAt),
        set: {
          name: sql`excluded."name"`,
          // onMeeting is the authority on what a room is called; a rename
          // there should show up here on the next connect.
          roomName: sql`excluded."roomName"`,
          accountId: sql`excluded."accountId"`,
          apiKey: sql`excluded."apiKey"`,
          apiSecret: sql`excluded."apiSecret"`,
          // Reconnecting is exactly how an admin fixes a room whose
          // credentials stopped working, so it clears the error rather than
          // leaving a healthy room still labelled broken.
          status: "active" as const,
          lastError: null,
          updatedBy: actor,
          updatedAt: new Date(),
        },
      })
      .returning({ id: MeetingAccountsTable.id }),
  );

  // Rooms the account no longer lists are deliberately left as they are:
  // sessions reference them, and this app cannot tell "that room was
  // cancelled" from "that response was incomplete".
  return { connected: written.length };
}

export async function renameMeetingAccount(
  ctx: OrgTRPCContext,
  input: RenameMeetingAccountInput,
) {
  const [meetingAccount] = await ctx.db
    .update(MeetingAccountsTable)
    .set({ name: input.name, updatedBy: actorLabel(ctx) })
    .where(scopedTo(ctx, input.id))
    .returning({ id: MeetingAccountsTable.id });

  if (!meetingAccount) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { id: meetingAccount.id };
}

/**
 * Soft-deletes the room and clears its stored credentials in the same
 * statement — splitting them would leave a decryptable key behind for good if
 * the second write failed.
 *
 * There is no remote revoke: onMeeting exposes no endpoint to invalidate an
 * API key pair, so the keys stay valid on their side until the admin rotates
 * them in onMeeting. That is stated on the disconnect dialog rather than left
 * for someone to assume otherwise.
 */
export async function disconnectMeetingAccount(
  ctx: OrgTRPCContext,
  input: MeetingAccountIdInput,
) {
  const [meetingAccount] = await ctx.db
    .update(MeetingAccountsTable)
    .set({
      deletedAt: new Date(),
      deletedBy: actorLabel(ctx),
      apiKey: null,
      apiSecret: null,
    })
    .where(scopedTo(ctx, input.id))
    .returning({ id: MeetingAccountsTable.id });

  if (!meetingAccount) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { id: meetingAccount.id };
}

/**
 * Records that this room's credentials stopped working, so the list can say so
 * instead of silently failing every class start. Best-effort by design: it
 * runs while another operation is already failing, and must not replace that
 * failure with its own.
 */
export async function recordMeetingAccountFailure(
  ctx: OrgTRPCContext,
  id: string,
  reason: string,
) {
  await ctx.db
    .update(MeetingAccountsTable)
    .set({
      status: "error",
      lastError: reason.slice(0, MAX_STORED_ERROR_LENGTH),
      updatedBy: actorLabel(ctx),
    })
    .where(scopedTo(ctx, id));
}

const MAX_STORED_ERROR_LENGTH = 512;

function scopedTo(ctx: OrgTRPCContext, id: string) {
  return and(
    eq(MeetingAccountsTable.id, id),
    eq(MeetingAccountsTable.organizationId, ctx.organizationId),
    isNull(MeetingAccountsTable.deletedAt),
  );
}

function actorLabel(ctx: OrgTRPCContext) {
  return ctx.session?.user.email ?? ctx.session?.user.id ?? "system";
}

function resolveEncryptionKey(ctx: OrgTRPCContext): string {
  try {
    return getCredentialsEncryptionKey();
  } catch (error) {
    if (error instanceof OnMeetingNotConfiguredError) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: ctx.t("meetingAccounts.errors.notConfigured"),
      });
    }
    throw error;
  }
}

/**
 * Maps an onMeeting failure onto this app's own copy. The provider's message
 * is deliberately dropped: in the connect flow it can echo submitted input,
 * and it is written by a third party in a language this app doesn't control.
 */
export function translateOnMeetingError(
  ctx: OrgTRPCContext,
  error: unknown,
): TRPCError {
  if (error instanceof OnMeetingApiError) {
    if (error.status === 401 || error.status === 403) {
      return new TRPCError({
        code: "UNAUTHORIZED",
        message: ctx.t("meetingAccounts.errors.rejected"),
      });
    }
    if (error.status === 429) {
      return new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: ctx.t("meetingAccounts.errors.providerRateLimited"),
      });
    }
    return new TRPCError({
      code: "BAD_GATEWAY",
      message: ctx.t("meetingAccounts.errors.unavailable"),
    });
  }

  return new TRPCError({
    code: "BAD_GATEWAY",
    message: ctx.t("meetingAccounts.errors.unavailable"),
  });
}
