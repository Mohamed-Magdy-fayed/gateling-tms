import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  eq,
  gt,
  isNotNull,
  isNull,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/drizzle";
import {
  GroupsTable,
  MeetingAccountsTable,
  SessionsTable,
} from "@/drizzle/schema";
import {
  getCredentialsEncryptionKey,
  OnMeetingNotConfiguredError,
  recordMeetingAccountFailure,
  translateOnMeetingError,
} from "@/features/system/live-classes/meeting-accounts/server";
import { decryptToken } from "@/integrations/oauth/token-crypto";
import { createMeeting, requestAccessToken } from "@/integrations/onmeeting";
import {
  isWithinMeetingWindow,
  selectAvailableMeetingAccount,
  sessionEndsAt,
} from "../lib/meeting-window";
import { canHostSession } from "../lib/session-links";
import type { OrgTRPCContext } from "./types";

export type StartSessionMeetingResult = {
  joinUrl: string;
  startUrl: string;
};

const MEETING_TOPIC_MAX_LENGTH = 200;

/**
 * How long a start-class claim is honoured before another attempt may take it
 * over. Comfortably longer than two timeout-bounded onMeeting requests, so it
 * only ever expires on a claim whose process is gone.
 */
const STALE_CLAIM_SECONDS = 120;

/**
 * Starts the class: creates the onMeeting meeting for this session and returns
 * its links.
 *
 * onMeeting's create call takes a room and a topic and **no start time** — a
 * meeting lives in a room rather than at a moment — so meetings cannot be
 * generated ahead of schedule the way the Zoom implementation did. This runs
 * when a host actually starts the class (STATE.md D143), which is also why it
 * is inline rather than an Inngest job: the teacher is waiting on this exact
 * link, so deferring it would trade a working class for a spinner. That is the
 * documented exception in `docs/inngest-offload-policy.md`.
 *
 * Idempotent: a session that already has a meeting hands back its stored
 * links. Starting twice must not strand the first meeting in a room while
 * everyone holds a link to the second.
 */
export async function startSessionMeeting(
  ctx: OrgTRPCContext,
  sessionId: string,
): Promise<StartSessionMeetingResult> {
  const session = await loadSession(ctx, sessionId);

  if (
    !canHostSession(
      { userId: ctx.session.user.id, role: ctx.role },
      session.teacherId,
    )
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: ctx.t("sessions.errors.notHost"),
    });
  }

  if (session.status === "cancelled") {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: ctx.t("sessions.errors.cancelled"),
    });
  }

  // Already started — return what exists rather than claiming a second room.
  if (session.meetingNumber && session.joinUrl && session.startUrl) {
    return { joinUrl: session.joinUrl, startUrl: session.startUrl };
  }

  if (
    !isWithinMeetingWindow(
      session.scheduledAt,
      session.durationMinutes,
      new Date(),
    )
  ) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: ctx.t("sessions.errors.outsideWindow"),
    });
  }

  const encryptionKey = resolveEncryptionKey(ctx);
  const reservation = await reserveMeetingAccount(ctx.organizationId, session);

  if (reservation.status === "superseded") {
    // Someone else started the same class while this call was waiting on the
    // lock. Their meeting is the real one.
    const started = await loadSession(ctx, sessionId);
    if (started.joinUrl && started.startUrl) {
      return { joinUrl: started.joinUrl, startUrl: started.startUrl };
    }
    throw new TRPCError({
      code: "CONFLICT",
      message: ctx.t("sessions.errors.startFailed"),
    });
  }

  if (reservation.status === "noRoom") {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: ctx.t("sessions.errors.noRoomAvailable"),
    });
  }

  const meeting = await createMeetingOn(
    ctx,
    reservation.account,
    encryptionKey,
    buildTopic(session.groupName, session.scheduledAt),
  );

  await ctx.db
    .update(SessionsTable)
    .set({
      meetingNumber: meeting.meetingNumber,
      joinUrl: meeting.joinUrl,
      startUrl: meeting.startUrl,
      status: session.status === "scheduled" ? "ongoing" : session.status,
    })
    .where(
      and(
        eq(SessionsTable.id, sessionId),
        eq(SessionsTable.organizationId, ctx.organizationId),
      ),
    );

  return { joinUrl: meeting.joinUrl, startUrl: meeting.startUrl };
}

/**
 * Calls onMeeting with one room's credentials.
 *
 * A failure here marks that room as needing attention before it is re-thrown:
 * an admin looking at the rooms page should be able to see *which* room's
 * credentials stopped working, rather than only hearing that classes won't
 * start. The provider's own error text never travels — `translateOnMeetingError`
 * maps it onto this app's copy (D146).
 */
async function createMeetingOn(
  ctx: OrgTRPCContext,
  account: { id: string; roomCode: string; apiKey: string; apiSecret: string },
  encryptionKey: string,
  topic: string,
) {
  try {
    const token = await requestAccessToken({
      apiKey: decryptToken(account.apiKey, encryptionKey),
      apiSecret: decryptToken(account.apiSecret, encryptionKey),
    });

    return await createMeeting(token, {
      topic,
      roomCode: account.roomCode,
      // The class link is handed out before the teacher arrives, and a student
      // staring at "waiting for host" has no way to tell that from a broken
      // link.
      joinBeforeHost: true,
      // Recording is switched off explicitly, not left to the room default.
      // Nothing in this app can retrieve a recording afterwards (D145), so
      // turning it on here would promise something the UI can't deliver.
      recording: false,
      alert: false,
    });
  } catch (error) {
    const translated = translateOnMeetingError(ctx, error);
    await recordMeetingAccountFailure(ctx, account.id, translated.message);
    throw translated;
  }
}

type MeetingAccountReservation =
  | { status: "noRoom" }
  | { status: "superseded" }
  | {
      status: "reserved";
      account: {
        id: string;
        roomCode: string;
        apiKey: string;
        apiSecret: string;
      };
    };

/**
 * Picks the room this session will run in and writes that choice to the row,
 * before any meeting exists.
 *
 * Choosing and recording have to be one atomic step. A room can host only one
 * live meeting at a time, and two hosts starting two overlapping classes would
 * otherwise both read "room A is free", both create a meeting in it, and the
 * second would collide. Read Committed doesn't stop that (the conflict is a
 * row neither transaction has written yet), so the selection runs under an
 * advisory lock keyed on the organization; the reservation the winner writes
 * is what the loser then sees as busy.
 *
 * The lock covers database work only — never the call to onMeeting. Holding it
 * across an external request would tie up a pooled connection per waiting
 * caller and could exhaust the pool with everyone blocked on the lock holder.
 */
async function reserveMeetingAccount(
  organizationId: string,
  session: { id: string; scheduledAt: Date; durationMinutes: number },
): Promise<MeetingAccountReservation> {
  return db.transaction(async (trx) => {
    await trx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${organizationId}, 0))`,
    );

    const accounts = await trx
      .select({
        id: MeetingAccountsTable.id,
        roomCode: MeetingAccountsTable.roomCode,
        apiKey: MeetingAccountsTable.apiKey,
        apiSecret: MeetingAccountsTable.apiSecret,
      })
      .from(MeetingAccountsTable)
      .where(
        and(
          eq(MeetingAccountsTable.organizationId, organizationId),
          eq(MeetingAccountsTable.status, "active"),
          isNotNull(MeetingAccountsTable.apiKey),
          isNotNull(MeetingAccountsTable.apiSecret),
          isNull(MeetingAccountsTable.deletedAt),
        ),
      )
      .orderBy(
        asc(MeetingAccountsTable.createdAt),
        asc(MeetingAccountsTable.id),
      );

    if (accounts.length === 0) return { status: "noRoom" };

    const endsAt = sessionEndsAt(session.scheduledAt, session.durationMinutes);

    // Every session already pointing at a room counts as busy, meeting or not
    // — a reservation is a booking even before onMeeting has been called.
    const busy = await trx
      .selectDistinct({ meetingAccountId: SessionsTable.meetingAccountId })
      .from(SessionsTable)
      .where(
        and(
          eq(SessionsTable.organizationId, organizationId),
          isNotNull(SessionsTable.meetingAccountId),
          ne(SessionsTable.id, session.id),
          ne(SessionsTable.status, "cancelled"),
          // Half-open overlap: a class starting exactly when another ends is
          // not a clash.
          lt(SessionsTable.scheduledAt, endsAt),
          // `sql.param` with the column attached is what encodes the Date for
          // the driver. Comparing against a raw expression leaves drizzle with
          // no column to infer an encoder from, and the unencoded Date reaches
          // postgres.js as a bind parameter it cannot write.
          gt(
            sql`${SessionsTable.scheduledAt} + (${SessionsTable.durationMinutes} * interval '1 minute')`,
            sql.param(session.scheduledAt, SessionsTable.scheduledAt),
          ),
        ),
      );

    const chosenId = selectAvailableMeetingAccount(
      accounts.map((account) => account.id),
      busy
        .map((row) => row.meetingAccountId)
        .filter((id): id is string => id !== null),
    );

    if (!chosenId) return { status: "noRoom" };

    // The reservation is the **exclusive claim on starting this session**, not
    // merely a booking of the room.
    //
    // Guarding on `meetingNumber IS NULL` alone is not enough: that column is
    // written only *after* the onMeeting call returns, and that call happens
    // outside this transaction. Two hosts pressing Start at once would both
    // find it null, both be told they had reserved, and both create a meeting
    // — the later write winning, and the earlier meeting left sitting in a
    // room with nobody holding a link to it. So an existing
    // `meetingAccountId` also blocks the claim.
    //
    // The time bound is what stops that from being a trap. A claim whose
    // process died between reserving and writing the meeting would otherwise
    // make the class permanently unstartable, so a claim older than
    // `STALE_CLAIM_SECONDS` may be taken over. Both provider requests are
    // individually timeout-bounded well inside that window, so a live attempt
    // is never stolen from.
    const [reserved] = await trx
      .update(SessionsTable)
      .set({ meetingAccountId: chosenId, updatedAt: new Date() })
      .where(
        and(
          eq(SessionsTable.id, session.id),
          eq(SessionsTable.organizationId, organizationId),
          isNull(SessionsTable.meetingNumber),
          or(
            isNull(SessionsTable.meetingAccountId),
            lt(
              SessionsTable.updatedAt,
              sql`now() - (${STALE_CLAIM_SECONDS} * interval '1 second')`,
            ),
          ),
        ),
      )
      .returning({ id: SessionsTable.id });

    if (!reserved) return { status: "superseded" };

    const account = accounts.find((candidate) => candidate.id === chosenId);
    // Narrowing only: `chosenId` came from this list, and the columns were
    // filtered non-null above.
    if (!account?.apiKey || !account.apiSecret) return { status: "noRoom" };

    return {
      status: "reserved",
      account: {
        id: account.id,
        roomCode: account.roomCode,
        apiKey: account.apiKey,
        apiSecret: account.apiSecret,
      },
    };
  });
}

async function loadSession(ctx: OrgTRPCContext, sessionId: string) {
  const [session] = await ctx.db
    .select({
      id: SessionsTable.id,
      scheduledAt: SessionsTable.scheduledAt,
      durationMinutes: SessionsTable.durationMinutes,
      status: SessionsTable.status,
      teacherId: SessionsTable.teacherId,
      meetingNumber: SessionsTable.meetingNumber,
      joinUrl: SessionsTable.joinUrl,
      startUrl: SessionsTable.startUrl,
      groupName: GroupsTable.name,
    })
    .from(SessionsTable)
    .innerJoin(
      GroupsTable,
      and(
        eq(GroupsTable.id, SessionsTable.groupId),
        eq(GroupsTable.organizationId, SessionsTable.organizationId),
      ),
    )
    .where(
      and(
        eq(SessionsTable.id, sessionId),
        eq(SessionsTable.organizationId, ctx.organizationId),
      ),
    );

  if (!session) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return session;
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
 * What the meeting is called inside onMeeting. The group name plus the date is
 * what a host scanning their onMeeting dashboard needs to tell one class from
 * the next; the session id would be precise and useless to a human.
 */
function buildTopic(groupName: string, scheduledAt: Date): string {
  const date = scheduledAt.toISOString().slice(0, 10);
  return `${groupName} — ${date}`.slice(0, MEETING_TOPIC_MAX_LENGTH);
}
