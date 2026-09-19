import { and, eq, gt, isNull, notInArray, sql } from "drizzle-orm";
import type { db as database } from "@/drizzle";
import {
  GroupsTable,
  OrganizationsTable,
  SessionsTable,
} from "@/drizzle/schema";
import { generateSessionOccurrences } from "./schedule";

/**
 * A database handle that can open a transaction — the app's `db` singleton, or
 * anything with the same surface (a test harness's scoped client).
 */
type Database = Pick<typeof database, "transaction">;

export type RegenerationResult = {
  removed: number;
  written: number;
};

/** Nothing to regenerate: shaped like a real run so callers need no branch. */
const emptyRegeneration: RegenerationResult = { removed: 0, written: 0 };

/**
 * Rewrites a group's future sessions to match its current weekly schedule.
 *
 * Lives here rather than inside the Inngest function so it has three callers
 * that can never disagree: the queued handler, the inline fallback the group
 * mutations use when the queue is unreachable, and the manual "regenerate"
 * action. A group whose schedule is set but whose sessions never appeared is
 * the worst failure this feature has, and it is what happens when the only
 * path to this code is a message that can be dropped in transit.
 *
 * Idempotent by construction: it reads the group under an advisory lock and
 * upserts against `unique(groupId, plannedAt)`, so running it twice — or
 * inline and queued at once — converges on the same rows.
 *
 * This tells no provider anything (STATE.md D143). Gateling Meetings rooms
 * are created when a class is started, not ahead of it, so a dropped
 * occurrence has no meeting to cancel and a new one has no meeting to
 * provision.
 */
export async function regenerateGroupSessions({
  db,
  organizationId,
  groupId,
}: {
  db: Database;
  organizationId: string;
  groupId: string;
}): Promise<RegenerationResult> {
  return db.transaction(async (trx): Promise<RegenerationResult> => {
    // Two rapid schedule edits would otherwise interleave their
    // delete-then-insert sequences and leave a mix of both schedules.
    // Serializes per group; released automatically at commit — same idiom
    // as on-organization-member-invited.ts.
    await trx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${groupId}, 0))`,
    );

    // Read *after* the lock, never before. Reading first would let two runs
    // load different revisions of the group and then take the lock in the
    // opposite order, so the one holding the older snapshot commits last and
    // quietly reinstates the schedule the user just replaced — the same
    // read-then-lock inversion D75(3) fixed in moveSection.
    const [group] = await trx
      .select({
        id: GroupsTable.id,
        schedule: GroupsTable.schedule,
        startDate: GroupsTable.startDate,
        sessionCount: GroupsTable.sessionCount,
        teacherId: GroupsTable.teacherId,
        timeZone: OrganizationsTable.timeZone,
      })
      .from(GroupsTable)
      .innerJoin(
        OrganizationsTable,
        eq(OrganizationsTable.id, GroupsTable.organizationId),
      )
      .where(
        and(
          eq(GroupsTable.id, groupId),
          eq(GroupsTable.organizationId, organizationId),
        ),
      );

    // The group was deleted between the request and this run. Nothing to
    // regenerate, and retrying will never change that.
    if (!group) return emptyRegeneration;

    const occurrences = generateSessionOccurrences({
      schedule: group.schedule,
      startDate: group.startDate,
      sessionCount: group.sessionCount,
      timeZone: group.timeZone,
    });

    const keptTimes = occurrences.map((o) => o.scheduledAt);
    // One "now" for the whole transaction, so the delete below and the
    // upsert's guard further down can't disagree about whether a session
    // sitting right on the boundary is still in the future.
    const regeneratedAt = new Date();

    // A row is matched to the pattern by `plannedAt` — the occurrence it was
    // generated for — not by where it currently sits. Someone who dragged
    // Monday's class to Tuesday on the calendar has not removed the Monday
    // occurrence from the plan; they have said where *that* occurrence
    // happens this week. Rows older than the column are matched by their
    // scheduled time, which is what `plannedAt` was backfilled from.
    const patternKey = sql`COALESCE(${SessionsTable.plannedAt}, ${SessionsTable.scheduledAt})`;

    // Only future, still-`scheduled` rows are disposable. Anything past,
    // ongoing, completed, or explicitly cancelled is history — a schedule
    // edit must not rewrite it.
    const staleCondition = and(
      eq(SessionsTable.groupId, groupId),
      eq(SessionsTable.organizationId, organizationId),
      eq(SessionsTable.status, "scheduled"),
      gt(SessionsTable.scheduledAt, regeneratedAt),
      // Untouched by anyone starting it — see the note below.
      isNull(SessionsTable.meetingCode),
      keptTimes.length > 0 ? notInArray(patternKey, keptTimes) : undefined,
    );

    // Only future, still-`scheduled` rows reach here, and a class nobody
    // started has no meeting — so a dropped occurrence leaves nothing behind
    // on Gateling Meetings to clean up.
    //
    // "Nobody started it" is checked, not assumed: the meeting code is
    // written in the same statement that moves the status off `scheduled`,
    // so the two conditions agree, and a schedule edit landing while a start
    // is in flight deletes nothing that is about to hold a room.
    const removed = await trx
      .delete(SessionsTable)
      .where(staleCondition)
      .returning({ id: SessionsTable.id });

    if (occurrences.length === 0) {
      return { removed: removed.length, written: 0 };
    }

    // A moved row still occupies the instant it was dragged to, and
    // unique(groupId, scheduledAt) is not this upsert's conflict target — so
    // an occurrence that lands exactly on a moved sibling's new time would
    // raise instead of resolving. Those occurrences are skipped: the slot is
    // taken, by a class a person put there on purpose.
    const occupiedByMovedRows = await trx
      .select({ scheduledAt: SessionsTable.scheduledAt })
      .from(SessionsTable)
      .where(
        and(
          eq(SessionsTable.groupId, groupId),
          eq(SessionsTable.organizationId, organizationId),
          sql`${SessionsTable.plannedAt} IS DISTINCT FROM ${SessionsTable.scheduledAt}`,
        ),
      );
    const occupiedTimes = new Set(
      occupiedByMovedRows.map((row) => row.scheduledAt.getTime()),
    );
    const insertable = occurrences.filter(
      (occurrence) => !occupiedTimes.has(occurrence.scheduledAt.getTime()),
    );

    if (insertable.length === 0) {
      return { removed: removed.length, written: 0 };
    }

    // Upsert against unique(groupId, plannedAt) rather than insert-or-ignore.
    // A row whose occurrence is still in the plan is never deleted above and
    // would never be re-inserted, so ignoring conflicts would leave its other
    // columns frozen at the old schedule: shortening a slot from 18:00-20:00
    // to 18:00-19:00, or reassigning the group's teacher, changes neither the
    // day nor the start time, and the stale duration/teacher would survive
    // every future regeneration. Conflict-updating keeps ids stable across an
    // edit *and* keeps the surviving rows accurate.
    const written = await trx
      .insert(SessionsTable)
      .values(
        insertable.map((occurrence) => ({
          organizationId,
          groupId,
          scheduledAt: occurrence.scheduledAt,
          plannedAt: occurrence.scheduledAt,
          durationMinutes: occurrence.durationMinutes,
          teacherId: group.teacherId,
        })),
      )
      .onConflictDoUpdate({
        target: [SessionsTable.groupId, SessionsTable.plannedAt],
        set: {
          durationMinutes: sql`excluded."durationMinutes"`,
          teacherId: sql`excluded."teacherId"`,
          updatedAt: regeneratedAt,
        },
        // Status is deliberately not overwritten, and the row is only touched
        // while it is still both future and `scheduled` — the same bar the
        // delete above applies. A session that already happened keeps the
        // duration and teacher it actually ran with, even if nobody ever moved
        // it off `scheduled`. Regeneration reshapes the plan; it doesn't
        // rewrite what happened.
        //
        // Nor does it undo a person: a row someone edited on the calendar
        // (`adjustedAt`) keeps its duration and teacher too. A substitute
        // teacher put on one class must survive the group being renamed.
        setWhere: and(
          eq(SessionsTable.status, "scheduled"),
          gt(SessionsTable.scheduledAt, regeneratedAt),
          isNull(SessionsTable.adjustedAt),
        ),
      })
      .returning({ id: SessionsTable.id });

    return { removed: removed.length, written: written.length };
  });
}
