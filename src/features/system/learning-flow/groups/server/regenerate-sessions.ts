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
 * upserts against `unique(groupId, scheduledAt)`, so running it twice — or
 * inline and queued at once — converges on the same rows.
 *
 * This tells no provider anything (STATE.md D143). onMeeting meetings are
 * created when a class is started, not ahead of it, so a dropped occurrence
 * has no meeting to cancel and a new one has no meeting to provision.
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

    // Only future, still-`scheduled` rows are disposable. Anything past,
    // ongoing, completed, or explicitly cancelled is history — a schedule
    // edit must not rewrite it.
    const staleCondition = and(
      eq(SessionsTable.groupId, groupId),
      eq(SessionsTable.organizationId, organizationId),
      eq(SessionsTable.status, "scheduled"),
      gt(SessionsTable.scheduledAt, regeneratedAt),
      // Untouched by anyone starting it — see the note below.
      isNull(SessionsTable.meetingAccountId),
      isNull(SessionsTable.meetingNumber),
      keptTimes.length > 0
        ? notInArray(SessionsTable.scheduledAt, keptTimes)
        : undefined,
    );

    // Only future, still-`scheduled` rows reach here, and a class nobody
    // started has no meeting — so a dropped occurrence leaves nothing behind
    // at onMeeting to clean up.
    //
    // "Nobody started it" is checked, not assumed. A session is claimed
    // (`meetingAccountId` written) a moment before its meeting exists and
    // before its status leaves `scheduled`, so a schedule edit landing in that
    // window would otherwise delete a class somebody is in the middle of
    // starting — and the teacher would be handed a link to a meeting whose
    // session row no longer exists.
    const removed = await trx
      .delete(SessionsTable)
      .where(staleCondition)
      .returning({ id: SessionsTable.id });

    if (occurrences.length === 0) {
      return { removed: removed.length, written: 0 };
    }

    // Upsert against unique(groupId, scheduledAt) rather than
    // insert-or-ignore. A row whose start instant didn't move is never deleted
    // above and would never be re-inserted, so ignoring conflicts would leave
    // its other columns frozen at the old schedule: shortening a slot from
    // 18:00-20:00 to 18:00-19:00, or reassigning the group's teacher, changes
    // neither the day nor the start time, and the stale duration/teacher would
    // survive every future regeneration. Conflict-updating keeps ids stable
    // across an edit *and* keeps the surviving rows accurate.
    const written = await trx
      .insert(SessionsTable)
      .values(
        occurrences.map((occurrence) => ({
          organizationId,
          groupId,
          scheduledAt: occurrence.scheduledAt,
          durationMinutes: occurrence.durationMinutes,
          teacherId: group.teacherId,
        })),
      )
      .onConflictDoUpdate({
        target: [SessionsTable.groupId, SessionsTable.scheduledAt],
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
        setWhere: and(
          eq(SessionsTable.status, "scheduled"),
          gt(SessionsTable.scheduledAt, regeneratedAt),
        ),
      })
      .returning({ id: SessionsTable.id });

    return { removed: removed.length, written: written.length };
  });
}
