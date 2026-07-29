import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  isNull,
  lt,
  type SQL,
} from "drizzle-orm";
import { db } from "@/drizzle";
import {
  GroupsTable,
  SessionsTable,
  UsersTable,
  ZoomClientsTable,
} from "@/drizzle/schema";
import { resolveSessionLinks } from "../lib/session-links";
import type { ListSessionsInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

const sessionColumns = {
  id: SessionsTable.id,
  scheduledAt: SessionsTable.scheduledAt,
  durationMinutes: SessionsTable.durationMinutes,
  status: SessionsTable.status,
  groupId: SessionsTable.groupId,
  groupName: GroupsTable.name,
  teacherId: SessionsTable.teacherId,
  teacherName: UsersTable.name,
  zoomMeetingId: SessionsTable.zoomMeetingId,
  zoomJoinUrl: SessionsTable.zoomJoinUrl,
  // Selected but never returned as-is: `toSessionRow` hands it only to the
  // assigned teacher or an admin (lib/session-links.ts).
  zoomStartUrl: SessionsTable.zoomStartUrl,
} as const;

export type SessionRow = {
  id: string;
  scheduledAt: Date;
  durationMinutes: number;
  status: (typeof SessionsTable.$inferSelect)["status"];
  groupId: string;
  groupName: string;
  teacherId: string | null;
  teacherName: string | null;
  /** Null while the session is offline — no Zoom meeting exists for it. */
  joinUrl: string | null;
  /** Host link, present only for the teacher running it and for admins. */
  startUrl: string | null;
};

/**
 * The org's agenda: upcoming classes soonest first, or past ones most recent
 * first. Readable by any member — a student needs to know when their class is
 * and how to join it.
 */
export async function listSessions(
  ctx: OrgTRPCContext,
  input: ListSessionsInput,
) {
  const now = new Date();
  const whereClause = and(
    eq(SessionsTable.organizationId, ctx.organizationId),
    input.groupId ? eq(SessionsTable.groupId, input.groupId) : undefined,
    input.scope === "upcoming"
      ? gte(SessionsTable.scheduledAt, now)
      : lt(SessionsTable.scheduledAt, now),
  );

  const [{ value: total }] = await ctx.db
    .select({ value: count() })
    .from(SessionsTable)
    .where(whereClause);

  const pageCount = Math.max(1, Math.ceil(Number(total) / input.perPage));
  const page = Math.min(input.page, pageCount);

  const rows = await selectSessions(
    ctx,
    whereClause,
    input.scope === "upcoming",
  )
    .limit(input.perPage)
    .offset((page - 1) * input.perPage);

  return {
    rows: rows.map((row) => toSessionRow(ctx, row)),
    page,
    pageCount,
    total: Number(total),
    // Lets the UI tell "this org never connected Zoom, and that's fine" apart
    // from "a meeting for this class hasn't been created yet".
    hasActiveZoomClient: await hasActiveZoomClient(ctx),
  };
}

/**
 * Every session of one group, in schedule order — the group detail page shows
 * the whole plan at once rather than paging through a term.
 */
export async function listGroupSessions(ctx: OrgTRPCContext, groupId: string) {
  const rows = await selectSessions(
    ctx,
    and(
      eq(SessionsTable.organizationId, ctx.organizationId),
      eq(SessionsTable.groupId, groupId),
    ),
    true,
  );

  return {
    rows: rows.map((row) => toSessionRow(ctx, row)),
    hasActiveZoomClient: await hasActiveZoomClient(ctx),
  };
}

/**
 * Future sessions with no meeting yet — what a newly connected Zoom account
 * has to catch up on, since those groups were scheduled while the org had no
 * way to host anything. Module-level `db` rather than a request context: the
 * caller is an Inngest function, not a tRPC route.
 */
export async function listSessionIdsAwaitingMeetings(
  organizationId: string,
  now = new Date(),
): Promise<string[]> {
  const rows = await db
    .select({ id: SessionsTable.id })
    .from(SessionsTable)
    .where(
      and(
        eq(SessionsTable.organizationId, organizationId),
        eq(SessionsTable.status, "scheduled"),
        gt(SessionsTable.scheduledAt, now),
        isNull(SessionsTable.zoomMeetingId),
      ),
    )
    .orderBy(asc(SessionsTable.scheduledAt), asc(SessionsTable.id));

  return rows.map((row) => row.id);
}

// `id` tiebreaks every order so ties don't leave offset pagination
// nondeterministic — same pattern as the other list queries (STATE.md D35).
function selectSessions(
  ctx: OrgTRPCContext,
  whereClause: SQL | undefined,
  soonestFirst: boolean,
) {
  return ctx.db
    .select(sessionColumns)
    .from(SessionsTable)
    .innerJoin(
      GroupsTable,
      and(
        eq(GroupsTable.id, SessionsTable.groupId),
        eq(GroupsTable.organizationId, SessionsTable.organizationId),
      ),
    )
    .leftJoin(UsersTable, eq(UsersTable.id, SessionsTable.teacherId))
    .where(whereClause)
    .orderBy(
      soonestFirst
        ? asc(SessionsTable.scheduledAt)
        : desc(SessionsTable.scheduledAt),
      asc(SessionsTable.id),
    );
}

/** What `selectSessions` returns, before the link rules are applied. */
type SessionQueryRow = Omit<SessionRow, "joinUrl" | "startUrl"> & {
  zoomMeetingId: string | null;
  zoomJoinUrl: string | null;
  zoomStartUrl: string | null;
};

function toSessionRow(ctx: OrgTRPCContext, row: SessionQueryRow): SessionRow {
  const links = resolveSessionLinks(
    { userId: ctx.session.user.id, role: ctx.role },
    {
      teacherId: row.teacherId,
      zoomJoinUrl: row.zoomJoinUrl,
      zoomStartUrl: row.zoomStartUrl,
    },
  );

  return {
    id: row.id,
    scheduledAt: row.scheduledAt,
    durationMinutes: row.durationMinutes,
    status: row.status,
    groupId: row.groupId,
    groupName: row.groupName,
    teacherId: row.teacherId,
    teacherName: row.teacherName,
    joinUrl: links.joinUrl,
    startUrl: links.startUrl,
  };
}

async function hasActiveZoomClient(ctx: OrgTRPCContext): Promise<boolean> {
  const [{ value }] = await ctx.db
    .select({ value: count() })
    .from(ZoomClientsTable)
    .where(
      and(
        eq(ZoomClientsTable.organizationId, ctx.organizationId),
        eq(ZoomClientsTable.status, "active"),
        isNull(ZoomClientsTable.deletedAt),
      ),
    );

  return Number(value) > 0;
}
