import { and, asc, eq, gt, notExists, sql } from "drizzle-orm";

import { db } from "@/drizzle";
import { GroupsTable, SessionsTable } from "@/drizzle/schema";
import { inngest } from "../client";
import { groupScheduleChangedEvent } from "./on-group-schedule-changed";

/** Groups read per database round trip while listing. */
const PAGE_SIZE = 500;

/** Events per `sendEvent` call — Inngest accepts at most 5,000. */
const EVENTS_PER_SEND = 1_000;

/**
 * Nightly sweep: regenerate any group that has a weekly schedule but no future
 * sessions to show for it.
 *
 * Generation is normally triggered by saving the group, and the mutation now
 * falls back to running it inline when the queue is unreachable — but a
 * process killed between the two, or a group whose sessions have all been
 * consumed since, would still sit there empty with nobody watching. This is
 * the floor: a group's schedule can be wrong for a day at worst, never
 * forever.
 *
 * Fan-out rather than regenerating inline so one group's lock contention can't
 * stall the rest, and so a failure retries that group alone. 02:41 UTC is
 * deliberately off the hour, and off the usage sweep's 03:17, so the two
 * nightly jobs don't contend.
 */
export const onSessionBackfillScheduled = inngest.createFunction(
  { id: "on-session-backfill-scheduled", triggers: [{ cron: "41 2 * * *" }] },
  async ({ step }) => {
    // One step for the whole listing, not one per page: every step counts
    // against Inngest's 1,000-step-per-run cap — same reasoning as
    // on-usage-reconciliation-scheduled.ts.
    const groups = await step.run("list-groups-missing-sessions", async () => {
      const rows: { id: string; organizationId: string }[] = [];
      let cursor: string | null = null;

      while (true) {
        // Keyset pagination on the primary key: offset pagination would skip
        // or repeat groups if one is created while the sweep runs.
        const page: { id: string; organizationId: string }[] = await db
          .select({
            id: GroupsTable.id,
            organizationId: GroupsTable.organizationId,
          })
          .from(GroupsTable)
          .where(
            and(
              // Archived and completed groups are not supposed to keep
              // producing sessions, so an empty list is the correct state for
              // them rather than something to repair.
              eq(GroupsTable.status, "active"),
              sql`jsonb_array_length(${GroupsTable.schedule}) > 0`,
              notExists(
                db
                  .select({ one: sql`1` })
                  .from(SessionsTable)
                  .where(
                    and(
                      eq(SessionsTable.groupId, GroupsTable.id),
                      eq(
                        SessionsTable.organizationId,
                        GroupsTable.organizationId,
                      ),
                      gt(SessionsTable.scheduledAt, sql`now()`),
                    ),
                  ),
              ),
              cursor ? gt(GroupsTable.id, cursor) : undefined,
            ),
          )
          .orderBy(asc(GroupsTable.id))
          .limit(PAGE_SIZE);

        if (page.length === 0) break;

        rows.push(...page);

        if (page.length < PAGE_SIZE) break;
        cursor = page[page.length - 1].id;
      }

      return rows;
    });

    for (let sent = 0; sent < groups.length; sent += EVENTS_PER_SEND) {
      await step.sendEvent(
        `regenerate-groups-${sent / EVENTS_PER_SEND}`,
        groups
          .slice(sent, sent + EVENTS_PER_SEND)
          .map(({ id, organizationId }) =>
            groupScheduleChangedEvent.create({ organizationId, groupId: id }),
          ),
      );
    }

    return { groups: groups.length };
  },
);
