import { eventType, NonRetriableError } from "inngest";
import { z } from "zod";

import {
  GoogleNotConfiguredError,
  getGoogleImportConfig,
} from "@/features/system/assessments/google-import/server";
import { revokeToken } from "@/integrations/google";
import { decryptToken } from "@/integrations/oauth/token-crypto";
import { inngest } from "../client";

/**
 * Fired when an org disconnects its Google account. The row is already gone by
 * the time this runs — telling Google to forget the grant is housekeeping the
 * admin shouldn't wait on (docs/inngest-offload-policy.md), and it is
 * retryable if Google is down.
 *
 * The payload carries the ciphertext rather than an id precisely because the
 * row no longer holds it: the disconnect deletes it so no readable credential
 * outlives the action.
 */
export const googleIntegrationDisconnectedEvent = eventType(
  "google-integration/disconnected",
  {
    schema: z.object({
      organizationId: z.string(),
      encryptedAccessToken: z.string(),
    }),
  },
);

export const onGoogleIntegrationDisconnected = inngest.createFunction(
  {
    id: "on-google-integration-disconnected",
    triggers: [googleIntegrationDisconnectedEvent],
  },
  async ({ event, step }) => {
    return step.run("revoke-google-token", async () => {
      let config: ReturnType<typeof getGoogleImportConfig>;

      try {
        config = getGoogleImportConfig();
      } catch (error) {
        // Credentials were removed between the disconnect and this run —
        // retrying can't fix that, and the grant is unusable either way.
        if (error instanceof GoogleNotConfiguredError) {
          throw new NonRetriableError(error.message);
        }
        throw error;
      }

      let accessToken: string;
      try {
        accessToken = decryptToken(
          event.data.encryptedAccessToken,
          config.encryptionKey,
        );
      } catch (error) {
        // Ciphertext this key can't open — a rotated key, or a tampered
        // payload. Neither improves on a retry, and the row is already gone,
        // so there is nothing left to fix by trying again. (The grant itself
        // survives at Google until its own expiry; rotating the key is
        // documented as forcing every org to reconnect.)
        throw new NonRetriableError(
          error instanceof Error ? error.message : "Token decryption failed.",
        );
      }

      await revokeToken(accessToken);

      return { revoked: true, organizationId: event.data.organizationId };
    });
  },
);
