import { and, eq, gt, notInArray, sql } from "drizzle-orm";
import { eventType } from "inngest";
import { z } from "zod";

import { db } from "@/drizzle";
import {
  GroupsTable,
  OrganizationsTable,
  SessionsTable,
} from "@/drizzle/schema";
import { generateSessionOccurrences } from "@/features/system/learning-flow/groups/server/schedule";
import { inngest } from "../client";

/**
 * Fired whenever a group's generated sessions could have gone stale: on
 * create, and on any edit to `schedule`, `startDate`, `sessionCount`, or
 * `teacherId`.
 *
 * phase-05.md names this `group/created`, but create and schedule-change need
 * byte-identical handling, and one event beats two triggers wired to the same
 * body (STATE.md D80). The payload carries ids only — the handler re-reads the
 * group, so an Inngest retry or redelivery can never act on a stale schedule.
 */
/**
 * This function no longer tells any provider anything (STATE.md D143).
 * onMeeting meetings are created when a class is started, not ahead of it, so
 * a dropped occurrence has no meeting to cancel and a new one has no meeting
 * to provision — regeneration is purely a database concern now.
 */
type RegenerationResult = {
  removed: number;
  writtenSessionIds: string[];
};

/** Nothing to regenerate: shaped like a real run so callers need no branch. */
const emptyRegeneration: RegenerationResult = {
  removed: 0,
  writtenSessionIds: [],
};

export const groupScheduleChangedEvent = eventType("group/schedule-changed", {
  schema: z.object({
    organizationId: z.string(),
    groupId: z.string(),
  }),
});

export const onGroupScheduleChanged = inngest.createFunction(
  { id: "on-group-schedule-changed", triggers: [groupScheduleChangedEvent] },
  async ({ event, step }) => {
    const { organizationId, groupId } = event.data;

    const result = await step.run("regenerate-group-sessions", async () => {
      return db.transaction(async (trx): Promise<RegenerationResult> => {
        // Two rapid schedule edits would otherwise interleave their
        // delete-then-insert sequences and leave a mix of both schedules.
        // Serializes per group; released automatically at commit — same idiom
        // as on-organization-member-invited.ts.
        await trx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtextextended(${groupId}, 0))`,
        );

        // Read *after* the lock, never before. Reading first would let two
        // events load different revisions of the group and then take the lock
        // in the opposite order, so the run holding the older snapshot commits
        // last and quietly reinstates the schedule the user just replaced —
        // the same read-then-lock inversion D75(3) fixed in moveSection.
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

        // The group was deleted between the mutation and this run. Nothing to
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
          keptTimes.length > 0
            ? notInArray(SessionsTable.scheduledAt, keptTimes)
            : undefined,
        );

        // Only future, still-`scheduled` rows reach here, and a class nobody
        // started has no meeting — so a dropped occurrence leaves nothing
        // behind at onMeeting to clean up.
        const removed = await trx
          .delete(SessionsTable)
          .where(staleCondition)
          .returning({ id: SessionsTable.id });

        if (occurrences.length === 0) {
          return {
            removed: removed.length,
            writtenSessionIds: [],
          };
        }

        // Upsert against unique(groupId, scheduledAt) rather than
        // insert-or-ignore. A row whose start instant didn't move is never
        // deleted above and would never be re-inserted, so ignoring conflicts
        // would leave its other columns frozen at the old schedule: shortening
        // a slot from 18:00-20:00 to 18:00-19:00, or reassigning the group's
        // teacher, changes neither the day nor the start time, and the stale
        // duration/teacher would survive every future regeneration.
        // Conflict-updating keeps ids stable across an edit *and* keeps the
        // surviving rows accurate.
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
            // Status is deliberately not overwritten, and the row is only
            // touched while it is still both future and `scheduled` — the same
            // bar the delete above applies. A session that already happened
            // keeps the duration and teacher it actually ran with, even if
            // nobody ever moved it off `scheduled`. Regeneration reshapes the
            // plan; it doesn't rewrite what happened.
            setWhere: and(
              eq(SessionsTable.status, "scheduled"),
              gt(SessionsTable.scheduledAt, regeneratedAt),
            ),
          })
          .returning({ id: SessionsTable.id });

        return {
          removed: removed.length,
          writtenSessionIds: written.map((session) => session.id),
        };
      });
    });

    // Nothing is dispatched from here any more. Under Zoom this step fanned
    // out a meeting-sync event per written session and a cancel per dropped
    // one; onMeeting meetings are created when the class starts instead
    // (STATE.md D143), so a regenerated schedule has nothing to tell anyone
    // about until someone actually starts a class.
    return {
      removed: result.removed,
      written: result.writtenSessionIds.length,
    };
  },
);
