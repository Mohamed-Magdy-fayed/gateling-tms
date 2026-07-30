import { eq } from "drizzle-orm";
import { GoogleIntegrationsTable } from "@/drizzle/schema";
import type { OrgTRPCContext } from "./types";

/**
 * Never includes `accessToken`/`refreshToken`. Those are encrypted at rest,
 * but a connected Google account is still a credential for someone else's
 * system — nothing outside this server module has a reason to see it, so the
 * shape the client gets can't carry it by accident (same rule as
 * zoom-clients/server/queries.ts).
 */
const googleIntegrationColumns = {
  id: GoogleIntegrationsTable.id,
  status: GoogleIntegrationsTable.status,
  googleEmail: GoogleIntegrationsTable.googleEmail,
  scope: GoogleIntegrationsTable.scope,
  lastError: GoogleIntegrationsTable.lastError,
  createdAt: GoogleIntegrationsTable.createdAt,
} as const;

export type GoogleIntegrationRow = {
  [K in keyof typeof googleIntegrationColumns]: (typeof GoogleIntegrationsTable)["$inferSelect"][K];
};

/**
 * Null rather than NOT_FOUND: "this org has no Google account connected" is
 * the ordinary starting state of every organization, and the page renders a
 * connect prompt for it — an error would make the normal case look broken.
 */
export async function getGoogleIntegration(
  ctx: OrgTRPCContext,
): Promise<GoogleIntegrationRow | null> {
  const [integration] = await ctx.db
    .select(googleIntegrationColumns)
    .from(GoogleIntegrationsTable)
    .where(eq(GoogleIntegrationsTable.organizationId, ctx.organizationId));

  return integration ?? null;
}
