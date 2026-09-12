import { and, eq } from "drizzle-orm";
import { eventType } from "inngest";
import { z } from "zod";

import { db } from "@/drizzle";
import { SessionsTable } from "@/drizzle/schema";
import { parseSessionExternalRef } from "@/features/system/live-classes/sessions/lib/meeting-ref";
import { inngest } from "../client";

/**
 * A verified delivery from Gateling Meetings, forwarded by
 * `app/api/meetings-webhook/route.ts` after the signature and replay window
 * checked out. Only `meeting.ended` is forwarded — it is the one event that
 * changes anything here — and the delivery id is reused as the Inngest event
 * id, so Meetings' own retries (six over an hour) never run this twice.
 *
 * Just what the handler reads, not the whole delivery: a payload this small
 * can't carry a surprise, and Meetings' schema can grow without this changing.
 */
export const meetingsWebhookReceivedEvent = eventType(
  "meetings/webhook.received",
  {
    schema: z.object({
      deliveryId: z.string(),
      event: z.literal("meeting.ended"),
      meeting: z.object({
        code: z.string(),
        externalRef: z.string().nullable(),
        endedAt: z.string().nullable(),
      }),
      endedBy: z.enum(["host", "integration", "room"]).optional(),
    }),
  },
);

/**
 * Closes the class when its room closes. The host pressing "End for all", the
 * last person leaving, or the room timing out on Meetings' side all arrive
 * here as one event, and the session goes `ongoing` → `completed` in
 * response — the only automatic status change a live class has.
 *
 * A compare-and-set on both the status and the meeting code, not a blind
 * update: a delivery for a room this session no longer points at (recreated
 * after Meetings lost the first one) or for a class already closed by hand
 * must leave the row alone. Attendance is *not* touched — it stays
 * teacher-marked (STATE.md D144); joins through a participant link are
 * anonymous on Meetings' side by design, so there is nothing to derive it
 * from.
 */
export const onMeetingsWebhook = inngest.createFunction(
  { id: "on-meetings-webhook", triggers: [meetingsWebhookReceivedEvent] },
  async ({ event, step }) => {
    const { meeting } = event.data;
    const sessionId = parseSessionExternalRef(meeting.externalRef);

    // A meeting that isn't a session's — created by hand on Meetings, or by
    // some future feature with its own ref shape. Nothing to do, and a retry
    // wouldn't change that.
    if (!sessionId) return { outcome: "not-a-session" as const };

    return step.run("complete-session", async () => {
      const [completed] = await db
        .update(SessionsTable)
        .set({ status: "completed", updatedAt: new Date() })
        .where(
          and(
            eq(SessionsTable.id, sessionId),
            eq(SessionsTable.meetingCode, meeting.code),
            eq(SessionsTable.status, "ongoing"),
          ),
        )
        .returning({ id: SessionsTable.id });

      return completed
        ? { outcome: "completed" as const, sessionId }
        : { outcome: "unchanged" as const, sessionId };
    });
  },
);
