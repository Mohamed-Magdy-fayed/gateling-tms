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
export const groupScheduleChangedEvent = eventType("group/schedule-changed", {
  schema: z.object({
    organizationId: z.string(),
    groupId: z.string(),
  }),
});

export const onGroupScheduleChanged = inngest.createFunction(
  { id: "on-group-schedule-changed", triggers: [groupScheduleChangedEvent] },
  async ({ event, step }) => {
    return step.run("regenerate-group-sessions", async () => {
      const { organizationId, groupId } = event.data;

      const [group] = await db
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
      if (!group) return { skipped: true as const };

      const occurrences = generateSessionOccurrences({
        schedule: group.schedule,
        startDate: group.startDate,
        sessionCount: group.sessionCount,
        timeZone: group.timeZone,
      });

      const result = await db.transaction(async (trx) => {
        // Two rapid schedule edits would otherwise interleave their
        // delete-then-insert sequences and leave a mix of both schedules.
        // Serializes per group; released automatically at commit — same idiom
        // as on-organization-member-invited.ts.
        await trx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtextextended(${groupId}, 0))`,
        );

        const keptTimes = occurrences.map((o) => o.scheduledAt);

        // Only future, still-`scheduled` rows are disposable. Anything past,
        // ongoing, completed, or explicitly cancelled is history — a schedule
        // edit must not rewrite it.
        const staleCondition = and(
          eq(SessionsTable.groupId, groupId),
          eq(SessionsTable.organizationId, organizationId),
          eq(SessionsTable.status, "scheduled"),
          gt(SessionsTable.scheduledAt, new Date()),
          keptTimes.length > 0
            ? notInArray(SessionsTable.scheduledAt, keptTimes)
            : undefined,
        );

        const removed = await trx
          .delete(SessionsTable)
          .where(staleCondition)
          .returning({ id: SessionsTable.id });

        if (occurrences.length === 0) {
          return { removed: removed.length, created: 0 };
        }

        // onConflictDoNothing against unique(groupId, scheduledAt) keeps the
        // untouched part of a schedule on its original rows, so ids stay
        // stable across an edit instead of churning on every save.
        const created = await trx
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
          .onConflictDoNothing({
            target: [SessionsTable.groupId, SessionsTable.scheduledAt],
          })
          .returning({ id: SessionsTable.id });

        return { removed: removed.length, created: created.length };
      });

      return result;
    });
  },
);
