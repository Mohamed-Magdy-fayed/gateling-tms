import { eventType } from "inngest";
import { z } from "zod";

import { db } from "@/drizzle";
import { regenerateGroupSessions } from "@/features/system/learning-flow/groups/server/regenerate-sessions";
import { inngest } from "../client";

/**
 * Fired whenever a group's generated sessions could have gone stale: on
 * create, and on any edit to `schedule`, `startDate`, `sessionCount`, or
 * `teacherId`. Also fired per group by the nightly backfill sweep.
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

/**
 * A thin wrapper: the work itself lives in `regenerateGroupSessions` so the
 * mutation's inline fallback and the manual "regenerate" action run exactly
 * the same code. Nothing is dispatched from here — under Zoom this fanned out
 * a meeting-sync event per written session, but onMeeting meetings are created
 * when the class starts (STATE.md D143), so a regenerated schedule has nothing
 * to tell anyone about until someone actually starts a class.
 */
export const onGroupScheduleChanged = inngest.createFunction(
  { id: "on-group-schedule-changed", triggers: [groupScheduleChangedEvent] },
  async ({ event, step }) => {
    const { organizationId, groupId } = event.data;

    return step.run("regenerate-group-sessions", async () =>
      regenerateGroupSessions({ db, organizationId, groupId }),
    );
  },
);
