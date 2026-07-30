import { asc, gt } from "drizzle-orm";

import { db } from "@/drizzle";
import { OrganizationsTable } from "@/drizzle/schema";
import { inngest } from "../client";
import { usageReconciliationRequestedEvent } from "./on-usage-reconciliation-requested";

/** Organizations read per database round trip while listing. */
const PAGE_SIZE = 500;

/** Events per `sendEvent` call — Inngest accepts at most 5,000. */
const EVENTS_PER_SEND = 1_000;

/**
 * Nightly sweep: fan one reconciliation event out per organization
 * (phase-08.md step 1).
 *
 * Fan-out rather than reconciling inline so one org's slow bucket listing
 * can't stall the rest, and so a failure retries that org alone. 03:17 UTC is
 * deliberately off the hour — a round time is when every other scheduled job
 * on shared infrastructure wakes up.
 */
export const onUsageReconciliationScheduled = inngest.createFunction(
  {
    id: "on-usage-reconciliation-scheduled",
    triggers: [{ cron: "17 3 * * *" }],
  },
  async ({ step }) => {
    // The whole listing is one step, not one step per page: every step counts
    // against Inngest's 1,000-step-per-run cap, so paging at the step level
    // would put a hard ceiling on how many organizations the sweep can ever
    // reach. The remaining bound is the 4 MiB step-output limit, which these
    // ids don't approach until roughly a hundred thousand organizations — at
    // which point a nightly full sweep is the wrong shape anyway.
    const organizationIds = await step.run("list-organizations", async () => {
      const ids: string[] = [];
      let cursor: string | null = null;

      while (true) {
        // Keyset pagination on the primary key: offset pagination would skip
        // or repeat organizations if one is created while the sweep runs.
        const rows = await db
          .select({ id: OrganizationsTable.id })
          .from(OrganizationsTable)
          .where(cursor ? gt(OrganizationsTable.id, cursor) : undefined)
          .orderBy(asc(OrganizationsTable.id))
          .limit(PAGE_SIZE);

        if (rows.length === 0) break;

        for (const row of rows) ids.push(row.id);

        if (rows.length < PAGE_SIZE) break;
        cursor = rows[rows.length - 1].id;
      }

      return ids;
    });

    for (let sent = 0; sent < organizationIds.length; sent += EVENTS_PER_SEND) {
      await step.sendEvent(
        `reconcile-organizations-${sent / EVENTS_PER_SEND}`,
        organizationIds
          .slice(sent, sent + EVENTS_PER_SEND)
          .map((organizationId) =>
            usageReconciliationRequestedEvent.create({ organizationId }),
          ),
      );
    }

    return { organizations: organizationIds.length };
  },
);
