import { eventType, NonRetriableError } from "inngest";
import { z } from "zod";

import {
  getZoomConfig,
  ZoomNotConfiguredError,
} from "@/features/system/live-classes/zoom-clients/server";
import { decryptToken, revokeAccessToken } from "@/integrations/zoom";
import { inngest } from "../client";

/**
 * Fired when an org disconnects a Zoom account. The row is already
 * soft-deleted and its tokens cleared by the time this runs — telling Zoom to
 * forget the grant is housekeeping the admin shouldn't wait on
 * (docs/inngest-offload-policy.md), and it is retryable if Zoom is down.
 *
 * The payload carries the ciphertext rather than an id precisely because the
 * row no longer holds it: the disconnect clears the columns so no readable
 * credential outlives the action.
 */
export const zoomClientDisconnectedEvent = eventType(
  "zoom-client/disconnected",
  {
    schema: z.object({
      organizationId: z.string(),
      zoomClientId: z.string(),
      encryptedAccessToken: z.string(),
    }),
  },
);

export const onZoomClientDisconnected = inngest.createFunction(
  {
    id: "on-zoom-client-disconnected",
    triggers: [zoomClientDisconnectedEvent],
  },
  async ({ event, step }) => {
    return step.run("revoke-zoom-token", async () => {
      let config: ReturnType<typeof getZoomConfig>;

      try {
        config = getZoomConfig();
      } catch (error) {
        // Credentials were removed between the disconnect and this run —
        // retrying can't fix that, and the grant is unusable either way.
        if (error instanceof ZoomNotConfiguredError) {
          throw new NonRetriableError(error.message);
        }
        throw error;
      }

      await revokeAccessToken(
        config.credentials,
        decryptToken(event.data.encryptedAccessToken, config.encryptionKey),
      );

      return { revoked: true, zoomClientId: event.data.zoomClientId };
    });
  },
);
