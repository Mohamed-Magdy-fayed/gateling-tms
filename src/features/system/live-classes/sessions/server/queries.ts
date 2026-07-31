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
  MeetingAccountsTable,
  SessionsTable,
  TraineesTable,
  UsersTable,
} from "@/drizzle/schema";
import { canHostSession, resolveSessionLinks } from "../lib/session-links";
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
  meetingNumber: SessionsTable.meetingNumber,
  joinUrl: SessionsTable.joinUrl,
  // Selected but never returned as-is: `toSessionRow` hands it only to the
  // assigned teacher or an admin (lib/session-links.ts).
  startUrl: SessionsTable.startUrl,
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
  /** Null until the class has been started — no meeting exists for it yet. */
  joinUrl: string | null;
  /** Host link, present only for the teacher running it and for admins. */
  startUrl: string | null;
  /**
   * Whether a meeting has been created for this session at all. Distinct from
   * `joinUrl` being null, which a student also sees before the class starts —
   * this is what the UI keys the "Start class" action off.
   */
  hasMeeting: boolean;
  /** Whether this viewer may start the class (STATE.md D143). */
  canStart: boolean;
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
    // Lets the UI tell "this org has no room connected, and that's fine" apart
    // from "this class just hasn't been started yet".
    hasActiveMeetingAccount: await hasActiveMeetingAccount(ctx),
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
    hasActiveMeetingAccount: await hasActiveMeetingAccount(ctx),
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
function ownClassesOnlyForStudents(ctx: OrgTRPCContext) {
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
  "joinUrl" | "startUrl" | "hasMeeting" | "canStart"
> & {
  meetingNumber: string | null;
  joinUrl: string | null;
  startUrl: string | null;
};

function toSessionRow(ctx: OrgTRPCContext, row: SessionQueryRow): SessionRow {
  const viewer = { userId: ctx.session.user.id, role: ctx.role };
  const links = resolveSessionLinks(viewer, {
    teacherId: row.teacherId,
    joinUrl: row.joinUrl,
    startUrl: row.startUrl,
  });

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
    hasMeeting: row.meetingNumber !== null,
    canStart: canHostSession(viewer, row.teacherId),
  };
}

/**
 * Whether the org has any onMeeting room connected at all — the difference
 * between "this class hasn't been started yet" and "this academy hasn't
 * connected a room", which read very differently to whoever is looking (D102).
 */
export async function hasActiveMeetingAccount(
  ctx: OrgTRPCContext,
): Promise<boolean> {
  const [{ value }] = await ctx.db
    .select({ value: count() })
    .from(MeetingAccountsTable)
    .where(
      and(
        eq(MeetingAccountsTable.organizationId, ctx.organizationId),
        eq(MeetingAccountsTable.status, "active"),
        isNull(MeetingAccountsTable.deletedAt),
      ),
    );

  return Number(value) > 0;
}
