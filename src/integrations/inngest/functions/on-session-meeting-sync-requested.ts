import { eventType, NonRetriableError } from "inngest";
import { z } from "zod";

import { syncSessionMeeting } from "@/features/system/live-classes/sessions/server";
import {
  ZoomClientNotConnectedError,
  ZoomNotConfiguredError,
} from "@/features/system/live-classes/zoom-clients/server";
import { inngest } from "../client";

/**
 * Fired for every future session a schedule change created or moved, and for
 * each session waiting on a meeting when an org connects its first Zoom
 * account.
 *
 * The payload carries ids only — the handler re-reads the session, so a retry
 * or a redelivery can never provision against a schedule that has since
 * changed. Talking to Zoom is exactly the kind of external round trip
 * `docs/inngest-offload-policy.md` wants off the request path; nobody is
 * standing on a spinner waiting for a meeting that starts next week.
 */
export const sessionMeetingSyncRequestedEvent = eventType(
  "session/meeting-sync-requested",
  {
    schema: z.object({
      organizationId: z.string(),
      sessionId: z.string(),
    }),
  },
);

export const onSessionMeetingSyncRequested = inngest.createFunction(
  {
    id: "on-session-meeting-sync-requested",
    triggers: [sessionMeetingSyncRequestedEvent],
  },
  async ({ event, step }) => {
    return step.run("sync-session-meeting", async () => {
      try {
        return await syncSessionMeeting(event.data);
      } catch (error) {
        // Zoom credentials gone from the deployment, or the account this
        // session was booked on has been disconnected: no number of retries
        // turns either into a meeting.
        if (
          error instanceof ZoomNotConfiguredError ||
          error instanceof ZoomClientNotConnectedError
        ) {
          throw new NonRetriableError(error.message);
        }
        throw error;
      }
    });
  },
);
