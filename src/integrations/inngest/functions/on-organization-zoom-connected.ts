import { eventType } from "inngest";
import { z } from "zod";

import { listSessionIdsAwaitingMeetings } from "@/features/system/live-classes/sessions/server";
import { inngest } from "../client";
import { sessionMeetingSyncRequestedEvent } from "./on-session-meeting-sync-requested";

/**
 * Fired when an org finishes connecting a Zoom account.
 *
 * Groups are usually scheduled before Zoom is set up — the product promises
 * an org can start working without any master-data or integration setup
 * (README rule 10) — so those sessions exist with no meeting. Connecting an
 * account is the moment they can get one, and nobody should have to re-save
 * every group's schedule to trigger it.
 */
export const organizationZoomConnectedEvent = eventType(
  "organization/zoom-connected",
  { schema: z.object({ organizationId: z.string() }) },
);

export const onOrganizationZoomConnected = inngest.createFunction(
  {
    id: "on-organization-zoom-connected",
    triggers: [organizationZoomConnectedEvent],
  },
  async ({ event, step }) => {
    const { organizationId } = event.data;

    const sessionIds = await step.run("list-sessions-awaiting-meetings", () =>
      listSessionIdsAwaitingMeetings(organizationId),
    );

    if (sessionIds.length === 0) return { requested: 0 };

    // One event per session: each provisioning call is then retried on its
    // own, and a single failing session can't hold up the rest of the term.
    await step.sendEvent(
      "request-session-meetings",
      sessionIds.map((sessionId) =>
        sessionMeetingSyncRequestedEvent.create({ organizationId, sessionId }),
      ),
    );

    return { requested: sessionIds.length };
  },
);
