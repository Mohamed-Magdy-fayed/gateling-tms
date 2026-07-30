import { asc, gt } from "drizzle-orm";

import { db } from "@/drizzle";
import { OrganizationsTable } from "@/drizzle/schema";
import { inngest } from "../client";
import { usageReconciliationRequestedEvent } from "./on-usage-reconciliation-requested";

/** Organizations fanned out per round trip. */
const PAGE_SIZE = 500;

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
    let cursor: string | null = null;
    let pageIndex = 0;
    let organizationCount = 0;

    while (true) {
      // Keyset pagination on the primary key: offset pagination would skip or
      // repeat organizations if one is created while the sweep is running.
      const currentCursor: string | null = cursor;
      const organizationIds: string[] = await step.run(
        `list-organizations-page-${pageIndex}`,
        async () => {
          const rows = await db
            .select({ id: OrganizationsTable.id })
            .from(OrganizationsTable)
            .where(
              currentCursor
                ? gt(OrganizationsTable.id, currentCursor)
                : undefined,
            )
            .orderBy(asc(OrganizationsTable.id))
            .limit(PAGE_SIZE);

          return rows.map((row) => row.id);
        },
      );

      if (organizationIds.length === 0) break;

      await step.sendEvent(
        `reconcile-organizations-page-${pageIndex}`,
        organizationIds.map((organizationId) =>
          usageReconciliationRequestedEvent.create({ organizationId }),
        ),
      );

      organizationCount += organizationIds.length;
      cursor = organizationIds[organizationIds.length - 1];
      pageIndex++;

      if (organizationIds.length < PAGE_SIZE) break;
    }

    return { organizations: organizationCount };
  },
);
