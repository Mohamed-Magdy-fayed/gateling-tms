import { type TRPC_ERROR_CODE_KEY, TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import { env } from "@/data/env/server";
import {
  GroupsTable,
  OrganizationsTable,
  SessionsTable,
  UsersTable,
} from "@/drizzle/schema";
import {
  type ExternalUser,
  MeetingsApiError,
  type MeetingsClient,
  mintHostJoinLink,
  mintParticipantJoinLink,
} from "@/integrations/meetings";
import type { SessionJoinResultCode } from "../lib/join-result";
import {
  buildMeetingTitle,
  buildSessionExternalRef,
  resolveMeetingHostUserId,
  sessionMeetingIdempotencyKey,
} from "../lib/meeting-ref";
import { isWithinMeetingWindow } from "../lib/meeting-window";
import {
  canHostSession,
  isMeetingHost,
  sessionJoinPath,
} from "../lib/session-links";
import { resolveMeetingsClient } from "./meetings-config";
import { ownClassesOnlyForStudents } from "./queries";
import type { OrgTRPCContext } from "./types";

export type StartSessionMeetingResult = {
  /** The plain share link, for anyone on the roster without an account. */
  joinUrl: string;
  /** Where the host's browser should go next — mints their host link. */
  joinPath: string;
};

export type SessionJoinLinkResult = {
  url: string;
  role: "host" | "participant";
};

/**
 * A start or join refused for a reason the member can act on. Carries the
 * reason as a code so the join route can redirect back with it (and only it)
 * in the URL, while tRPC callers still get the translated message.
 */
export class SessionMeetingError extends TRPCError {
  constructor(
    ctx: OrgTRPCContext,
    code: TRPC_ERROR_CODE_KEY,
    readonly reason: SessionJoinResultCode,
    cause?: unknown,
  ) {
    super({ code, message: ctx.t(`sessions.errors.${reason}`), cause });
    this.name = "SessionMeetingError";
  }
}

/**
 * Starts the class: creates its Gateling Meetings room and records it.
 *
 * On demand rather than ahead of schedule (STATE.md D143), and inline rather
 * than through Inngest: the host is waiting on this exact link, so deferring
 * it would trade a working class for a spinner — the documented exception in
 * `docs/inngest-offload-policy.md`.
 *
 * Idempotent twice over. A session that already has a meeting hands it back.
 * Two hosts pressing Start at once both create with the same idempotency key,
 * so Meetings returns one meeting to both; the compare-and-set write below
 * then lets the first one land and the second read what it wrote. No
 * advisory lock is needed on this side — there is no room capacity to
 * reserve any more.
 */
export async function startSessionMeeting(
  ctx: OrgTRPCContext,
  sessionId: string,
): Promise<StartSessionMeetingResult> {
  const session = await loadSession(ctx, sessionId);
  const viewer = { userId: ctx.session.user.id, role: ctx.role };

  if (!canHostSession(viewer, session.teacherId)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: ctx.t("sessions.errors.notHost"),
    });
  }

  if (session.status === "cancelled") {
    throw new SessionMeetingError(ctx, "PRECONDITION_FAILED", "cancelled");
  }

  // Already started — hand back what exists rather than opening a second room.
  if (session.meetingCode && session.joinUrl) {
    return { joinUrl: session.joinUrl, joinPath: sessionJoinPath(session.id) };
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

  const client = await requireMeetingsClient(ctx);
  const hostUserId = resolveMeetingHostUserId(
    session.teacherId,
    ctx.session.user.id,
  );
  const host = await loadExternalUser(ctx, hostUserId);

  let meeting: Awaited<ReturnType<MeetingsClient["createMeeting"]>>;
  try {
    meeting = await client.createMeeting(
      {
        title: buildMeetingTitle(session.groupName, session.scheduledAt),
        host,
        externalRef: buildSessionExternalRef(session.id),
        scheduledAt: session.scheduledAt.toISOString(),
        durationMinutes: session.durationMinutes,
        timezone: session.timeZone,
        settings: {
          // Students arrive through the share link or a participant link, and
          // a class of thirty can't be admitted one by one — nor should a
          // student who dropped and came back sit outside until noticed.
          waitingRoom: false,
          allowGuests: true,
          allowScreenShare: true,
        },
      },
      sessionMeetingIdempotencyKey(session.id),
    );
  } catch (error) {
    throw translateMeetingsError(ctx, error);
  }

  // Compare-and-set on "no meeting yet": whoever writes first wins, and the
  // other start — which got the same meeting from Meetings anyway — reads it
  // back below instead of overwriting.
  const [written] = await ctx.db
    .update(SessionsTable)
    .set({
      meetingCode: meeting.code,
      joinUrl: meeting.guestUrl,
      meetingHostUserId: hostUserId,
      status: session.status === "scheduled" ? "ongoing" : session.status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(SessionsTable.id, session.id),
        eq(SessionsTable.organizationId, ctx.organizationId),
        isNull(SessionsTable.meetingCode),
      ),
    )
    .returning({ id: SessionsTable.id });

  if (written) {
    return { joinUrl: meeting.guestUrl, joinPath: sessionJoinPath(session.id) };
  }

  const started = await loadSession(ctx, session.id);
  if (started.joinUrl) {
    return { joinUrl: started.joinUrl, joinPath: sessionJoinPath(session.id) };
  }
  throw new TRPCError({
    code: "CONFLICT",
    message: ctx.t("sessions.errors.startFailed"),
  });
}

/**
 * Mints the signed link that sends this member into the class without a
 * second login — as the host when they are the one Meetings knows as host,
 * as a participant (name filled in, passcode and waiting room skipped)
 * otherwise. One link per click: host links are single-use and expire within
 * minutes, which is why nothing here is ever stored.
 *
 * Visibility follows the agenda's own rule: staff may join any class in the
 * org, a student only one their trainee record is on.
 */
export async function createSessionJoinLink(
  ctx: OrgTRPCContext,
  sessionId: string,
): Promise<SessionJoinLinkResult> {
  const session = await loadSession(ctx, sessionId, {
    visibleToViewer: true,
  });

  if (session.status === "cancelled") {
    throw new SessionMeetingError(ctx, "PRECONDITION_FAILED", "cancelled");
  }

  if (!session.meetingCode) {
    throw new SessionMeetingError(ctx, "PRECONDITION_FAILED", "notStarted");
  }

  const client = await requireMeetingsClient(ctx);
  const viewer = { userId: ctx.session.user.id, role: ctx.role };
  const user = await loadExternalUser(ctx, viewer.userId);
  const role = isMeetingHost(viewer, session.meetingHostUserId)
    ? "host"
    : "participant";
  const options = { returnUrl: meetingReturnUrl() };

  try {
    const link =
      role === "host"
        ? await mintHostJoinLink(client, session.meetingCode, user, options)
        : await mintParticipantJoinLink(
            client,
            session.meetingCode,
            user,
            options,
          );
    return { url: link.url, role };
  } catch (error) {
    throw translateMeetingsError(ctx, error);
  }
}

/**
 * Where "Back to Gateling-TMS" points after the meeting. Only on a real
 * deployment: Meetings refuses a `returnUrl` outside the integration's
 * allowed origins, and a laptop's `http://localhost` (which `npm run preview`
 * sets as BASE_URL too) is never on that list — so anything but https sends
 * none rather than being unable to join at all.
 */
function meetingReturnUrl(): string | undefined {
  return env.BASE_URL?.startsWith("https://")
    ? `${env.BASE_URL}/live-classes/sessions`
    : undefined;
}

/**
 * The client for this deployment's Meetings integration, as set on the
 * settings page — or a refusal that tells the member live classes aren't set
 * up here, which an admin can fix without a deploy.
 */
async function requireMeetingsClient(
  ctx: OrgTRPCContext,
): Promise<MeetingsClient> {
  const client = await resolveMeetingsClient(ctx.db);
  if (!client) {
    throw new SessionMeetingError(ctx, "PRECONDITION_FAILED", "notConfigured");
  }
  return client;
}

/**
 * The person as Meetings should know them. `externalId` is this app's user
 * id — stable across organizations, so a teacher who works for two academies
 * is one linked account there, not two.
 */
async function loadExternalUser(
  ctx: OrgTRPCContext,
  userId: string,
): Promise<ExternalUser> {
  const [user] = await ctx.db
    .select({ name: UsersTable.name, email: UsersTable.email })
    .from(UsersTable)
    .where(eq(UsersTable.id, userId));

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return {
    externalId: userId,
    // A name is what shows on the tile in the room; an account with none
    // (possible after an OAuth sign-up) still needs something readable.
    name: user.name?.trim() || user.email,
    email: user.email,
  };
}

async function loadSession(
  ctx: OrgTRPCContext,
  sessionId: string,
  { visibleToViewer = false }: { visibleToViewer?: boolean } = {},
) {
  const [session] = await ctx.db
    .select({
      id: SessionsTable.id,
      scheduledAt: SessionsTable.scheduledAt,
      durationMinutes: SessionsTable.durationMinutes,
      status: SessionsTable.status,
      teacherId: SessionsTable.teacherId,
      meetingCode: SessionsTable.meetingCode,
      joinUrl: SessionsTable.joinUrl,
      meetingHostUserId: SessionsTable.meetingHostUserId,
      groupName: GroupsTable.name,
      timeZone: OrganizationsTable.timeZone,
    })
    .from(SessionsTable)
    .innerJoin(
      GroupsTable,
      and(
        eq(GroupsTable.id, SessionsTable.groupId),
        eq(GroupsTable.organizationId, SessionsTable.organizationId),
      ),
    )
    .innerJoin(
      OrganizationsTable,
      eq(OrganizationsTable.id, SessionsTable.organizationId),
    )
    .where(
      and(
        eq(SessionsTable.id, sessionId),
        eq(SessionsTable.organizationId, ctx.organizationId),
        visibleToViewer ? ownClassesOnlyForStudents(ctx) : undefined,
      ),
    );

  if (!session) {
    throw new SessionMeetingError(ctx, "NOT_FOUND", "notFound");
  }

  return session;
}

/**
 * Maps a Meetings failure onto this app's own copy. The provider's message is
 * deliberately dropped from what a member sees — it is written for the
 * operator, in a language this app doesn't control — but its status is what
 * decides which of our messages applies.
 */
export function translateMeetingsError(
  ctx: OrgTRPCContext,
  error: unknown,
): TRPCError {
  if (error instanceof MeetingsApiError) {
    // 401/403: the deployment's key was revoked or rotated — an operator
    // problem, not something a member can fix. 400 on a join link means the
    // return origin isn't allowed there, which is also configuration.
    if (error.status === 401 || error.status === 403 || error.status === 400) {
      return new SessionMeetingError(
        ctx,
        "PRECONDITION_FAILED",
        "misconfigured",
        error,
      );
    }
    // The room is gone (deleted on Meetings' side) or already ended.
    if (error.status === 404 || error.status === 412) {
      return new SessionMeetingError(
        ctx,
        "PRECONDITION_FAILED",
        "meetingOver",
        error,
      );
    }
    if (error.status === 409 || error.status === 429) {
      return new SessionMeetingError(ctx, "TOO_MANY_REQUESTS", "busy", error);
    }
  }

  return new SessionMeetingError(ctx, "BAD_GATEWAY", "unavailable", error);
}
