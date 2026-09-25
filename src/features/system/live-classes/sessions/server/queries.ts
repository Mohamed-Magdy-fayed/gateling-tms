import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  type SQL,
} from "drizzle-orm";
import {
  GroupStudentsTable,
  GroupsTable,
  OrganizationsTable,
  SessionsTable,
  TraineesTable,
  UsersTable,
} from "@/drizzle/schema";
import {
  canHostSession,
  isMeetingHost,
  sessionJoinPath,
} from "../lib/session-links";
import {
  monthBoundsInZone,
  monthStartOf,
  todayInZone,
  weekBoundsInZone,
  weekStartOf,
} from "../lib/week";
import { isLiveClassesEnabled } from "./meetings-config";
import type {
  ListSessionsInput,
  MonthSessionsInput,
  WeekSessionsInput,
} from "./schemas";
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
  meetingCode: SessionsTable.meetingCode,
  joinUrl: SessionsTable.joinUrl,
  // Never returned as-is: `toSessionRow` turns it into `isHost` for the one
  // viewer it names (lib/session-links.ts).
  meetingHostUserId: SessionsTable.meetingHostUserId,
  adjustedAt: SessionsTable.adjustedAt,
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
  /**
   * Whether a person changed this row on the calendar — moved it, resized
   * it, or swapped its teacher — so it no longer follows the group's weekly
   * pattern. The week view marks these so a deviation from the routine is
   * visible at a glance.
   */
  isAdjusted: boolean;
  /**
   * The meeting's plain share link — null until the class has been started.
   * Safe for anyone on the roster: it is what staff paste into the class
   * group for students who have no account here.
   */
  joinUrl: string | null;
  /**
   * Whether a meeting has been created for this session at all; what the UI
   * keys the "Start class" action off. Always equal to `joinUrl !== null`
   * today, kept separate so the two can diverge without touching the UI.
   */
  hasMeeting: boolean;
  /** Whether this viewer may start the class (STATE.md D143). */
  canStart: boolean;
  /**
   * Whether this viewer holds host rights on the meeting — Meetings binds them
   * to one account, recorded when the class was started, so an admin who
   * didn't start it joins as a participant (lib/session-links.ts).
   */
  isHost: boolean;
  /** The in-app route that mints this viewer's signed join link per click. */
  joinPath: string;
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
    ownClassesOnlyForStudents(ctx),
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
    // Lets the UI tell "this deployment doesn't run live classes" apart from
    // "this class just hasn't been started yet".
    liveClassesEnabled: await isLiveClassesEnabled(ctx.db),
  };
}

/**
 * One calendar week of classes, Saturday to Friday on the academy's clock.
 *
 * `weekStart` has to be the week's first day: the calendar navigates by
 * whole weeks and every cell it draws assumes the range starts on a
 * Saturday, so a mid-week date would put the columns and the rows out of
 * step. It is snapped here rather than rejected — a bookmarked URL from a
 * viewer in another zone lands on the right week instead of an error.
 *
 * The teacher filter is applied in the query, not the client: a week can
 * hold more classes than the agenda pages through, and the calendar wants
 * exactly what it will draw.
 */
export async function listWeekSessions(
  ctx: OrgTRPCContext,
  input: WeekSessionsInput,
) {
  const timeZone = await organizationTimeZone(ctx);
  const weekStart = weekStartOf(input.weekStart, timeZone);
  const bounds = weekBoundsInZone(weekStart, timeZone);
  if (!bounds) throw invalidDate(ctx);

  return {
    weekStart,
    timeZone,
    ...(await loadRangeSessions(ctx, bounds, input.teacherId)),
  };
}

/**
 * One month of classes as the month grid draws it: every whole
 * Saturday-to-Friday week that touches the month, so the leading and
 * trailing days from the neighbouring months are filled in too.
 *
 * `month` is snapped to the 1st, and when it's left out the server picks
 * the current month on the academy's clock — the client can't know that
 * zone before its organization query lands, and a guess in UTC fetches the
 * wrong month for the first minutes of every month in Cairo.
 */
export async function listMonthSessions(
  ctx: OrgTRPCContext,
  input: MonthSessionsInput,
) {
  const timeZone = await organizationTimeZone(ctx);
  const monthStart = monthStartOf(
    input.month ?? todayInZone(new Date(), timeZone),
  );
  const bounds = monthBoundsInZone(monthStart, timeZone);
  if (!bounds) throw invalidDate(ctx);

  return {
    monthStart,
    gridStart: bounds.gridStart,
    gridEnd: bounds.gridEnd,
    timeZone,
    ...(await loadRangeSessions(ctx, bounds, input.teacherId)),
  };
}

async function organizationTimeZone(ctx: OrgTRPCContext): Promise<string> {
  const organization = await ctx.db.query.OrganizationsTable.findFirst({
    where: eq(OrganizationsTable.id, ctx.organizationId),
    columns: { timeZone: true },
  });
  if (!organization) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }
  return organization.timeZone;
}

function invalidDate(ctx: OrgTRPCContext) {
  return new TRPCError({
    code: "BAD_REQUEST",
    message: ctx.t("groups.validation.date"),
  });
}

/**
 * The classes inside `[start, end)` that this viewer may see — the calendar
 * views' shared query. The teacher filter is applied here rather than in
 * the client: a range can hold more classes than the agenda pages through,
 * and the calendar wants exactly what it will draw.
 */
async function loadRangeSessions(
  ctx: OrgTRPCContext,
  bounds: { start: Date; end: Date },
  teacherId: string | undefined,
) {
  const rows = await selectSessions(
    ctx,
    and(
      eq(SessionsTable.organizationId, ctx.organizationId),
      ownClassesOnlyForStudents(ctx),
      teacherId ? eq(SessionsTable.teacherId, teacherId) : undefined,
      gte(SessionsTable.scheduledAt, bounds.start),
      lt(SessionsTable.scheduledAt, bounds.end),
    ),
    true,
  );

  return {
    rows: rows.map((row) => toSessionRow(ctx, row)),
    liveClassesEnabled: await isLiveClassesEnabled(ctx.db),
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
      ownClassesOnlyForStudents(ctx),
    ),
    true,
  );

  return {
    rows: rows.map((row) => toSessionRow(ctx, row)),
    liveClassesEnabled: await isLiveClassesEnabled(ctx.db),
  };
}

/**
 * A member with the `student` role sees only the classes they are actually in.
 *
 * Everything else in the org agenda — every group's schedule, its teacher, and
 * a link that joins the meeting — is staff information. Admins and teachers
 * see all of it (a teacher may be covering someone else's class); a student is
 * restricted to the groups their own trainee record is on, via the
 * `trainees.userId` bridge. A student with no trainee record matches nothing,
 * which is the correct answer rather than an error.
 */
export function ownClassesOnlyForStudents(ctx: OrgTRPCContext) {
  if (ctx.role !== "student") return undefined;

  const ownGroupIds = ctx.db
    .select({ groupId: GroupStudentsTable.groupId })
    .from(GroupStudentsTable)
    .innerJoin(
      TraineesTable,
      and(
        eq(TraineesTable.id, GroupStudentsTable.traineeId),
        eq(TraineesTable.userId, ctx.session.user.id),
        isNull(TraineesTable.deletedAt),
      ),
    )
    .where(eq(GroupStudentsTable.organizationId, ctx.organizationId));

  return inArray(SessionsTable.groupId, ownGroupIds);
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
type SessionQueryRow = Omit<
  SessionRow,
  "joinUrl" | "hasMeeting" | "canStart" | "isHost" | "joinPath" | "isAdjusted"
> & {
  meetingCode: string | null;
  joinUrl: string | null;
  meetingHostUserId: string | null;
  adjustedAt: Date | null;
};

function toSessionRow(ctx: OrgTRPCContext, row: SessionQueryRow): SessionRow {
  const viewer = { userId: ctx.session.user.id, role: ctx.role };

  return {
    id: row.id,
    scheduledAt: row.scheduledAt,
    durationMinutes: row.durationMinutes,
    status: row.status,
    groupId: row.groupId,
    groupName: row.groupName,
    teacherId: row.teacherId,
    teacherName: row.teacherName,
    isAdjusted: row.adjustedAt !== null,
    joinUrl: row.joinUrl,
    hasMeeting: row.meetingCode !== null,
    canStart: canHostSession(viewer, row.teacherId),
    isHost: isMeetingHost(viewer, row.meetingHostUserId),
    joinPath: sessionJoinPath(row.id),
  };
}
