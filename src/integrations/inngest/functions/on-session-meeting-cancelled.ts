import { eventType, NonRetriableError } from "inngest";
import { z } from "zod";

import { cancelSessionMeeting } from "@/features/system/live-classes/sessions/server";
import {
  ZoomClientNotConnectedError,
  ZoomNotConfiguredError,
} from "@/features/system/live-classes/zoom-clients/server";
import { inngest } from "../client";

/**
 * Fired when a session that owned a Zoom meeting is removed — a schedule edit
 * that drops a future occurrence, or a deleted group.
 *
 * Without this the meeting would linger in the org's Zoom account with nothing
 * pointing at it, and rescheduling a course would slowly fill the account with
 * classes that no longer exist. The meeting ids travel in the payload because
 * the row that held them is already gone.
 */
export const sessionMeetingCancelledEvent = eventType(
  "session/meeting-cancelled",
  {
    schema: z.object({
      organizationId: z.string(),
      zoomClientId: z.string(),
      zoomMeetingId: z.string(),
    }),
  },
);

export const onSessionMeetingCancelled = inngest.createFunction(
  {
    id: "on-session-meeting-cancelled",
    triggers: [sessionMeetingCancelledEvent],
  },
  async ({ event, step }) => {
    return step.run("delete-zoom-meeting", async () => {
      try {
        await cancelSessionMeeting(event.data);
      } catch (error) {
        // The account was disconnected (or Zoom was removed from the
        // deployment) before this ran. Retrying can't reach a meeting we no
        // longer hold a token for; disconnecting revokes the grant anyway.
        if (
          error instanceof ZoomNotConfiguredError ||
          error instanceof ZoomClientNotConnectedError
        ) {
          throw new NonRetriableError(error.message);
        }
        throw error;
      }

      return { deleted: true, zoomMeetingId: event.data.zoomMeetingId };
    });
  },
);
