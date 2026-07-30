import { eq } from "drizzle-orm";
import { eventType } from "inngest";
import { z } from "zod";

import { db } from "@/drizzle";
import { OrganizationsTable } from "@/drizzle/schema";
import {
  computeUsageDrift,
  countOrganizationUsage,
  toUsageCorrection,
  type UsageDiscrepancy,
} from "@/features/core/organizations/server";
import { isFirebaseConfigured } from "@/integrations/firebase/admin";
import { sumOrgStorageBytes } from "@/integrations/firebase/storage";
import { inngest } from "../client";

/**
 * Recompute one organization's plan counters from the rows themselves and
 * correct any drift (phase-08.md step 1).
 *
 * `studentCount`/`courseCount`/`storageBytes` are maintained by hand in every
 * write path, so a crashed transaction, a direct database edit, or a future
 * write path that forgets its bump leaves the plan limits enforced against a
 * number nobody can see is wrong. This is both the nightly sweep's per-org
 * worker (fanned out by `on-usage-reconciliation-scheduled.ts`) and the
 * on-demand entry point — send the event with an organization id to reconcile
 * one org immediately.
 */
export const usageReconciliationRequestedEvent = eventType(
  "organization/usage-reconciliation-requested",
  { schema: z.object({ organizationId: z.string() }) },
);

/** Why storage wasn't compared on a run, when it wasn't. */
type StorageSkipReason =
  | "not-configured"
  | "measurement-failed"
  | "changed-during-measurement";

type ReconciliationResult = {
  discrepancies: UsageDiscrepancy[];
  storageSkipped: StorageSkipReason | null;
};

export const onUsageReconciliationRequested = inngest.createFunction(
  {
    id: "on-usage-reconciliation-requested",
    triggers: [usageReconciliationRequestedEvent],
  },
  async ({ event, step }) => {
    const { organizationId } = event.data;

    // Read before measuring, so the transaction below can tell whether an
    // upload or a delete landed while the bucket was being walked.
    const storageBytesBeforeMeasuring = await step.run(
      "read-stored-storage-bytes",
      async () => {
        const organization = await db.query.OrganizationsTable.findFirst({
          where: eq(OrganizationsTable.id, organizationId),
          columns: { storageBytes: true },
        });

        return organization?.storageBytes ?? null;
      },
    );

    // Outside the transaction on purpose: this is an external API call, and
    // holding the organization row locked across it would stall every write
    // to that org for as long as the listing takes (the same tradeoff
    // uploads make — STATE.md D70).
    //
    // A bucket failure is caught rather than thrown: letting it fail the step
    // would retry — and eventually give up on — the whole run, so a
    // misconfigured bucket would stop the two database counters from ever
    // being reconciled. Storage is the part that can't be measured; the
    // counts still can.
    const measured = await step.run("measure-storage-bytes", async () => {
      if (!isFirebaseConfigured()) {
        return { bytes: null, skipped: "not-configured" as const };
      }

      try {
        return {
          bytes: await sumOrgStorageBytes(organizationId),
          skipped: null,
        };
      } catch (error) {
        console.error(
          "Failed to measure organization storage",
          organizationId,
          error,
        );
        return { bytes: null, skipped: "measurement-failed" as const };
      }
    });

    const result = await step.run(
      "reconcile-usage-counters",
      async (): Promise<ReconciliationResult> => {
        return db.transaction(async (trx) => {
          // The same lock every counter writer takes (createTrainee,
          // createCourse, both imports): a concurrent create either committed
          // before this read and is counted, or blocks until this correction
          // commits and then bumps the corrected value. An advisory lock
          // would not serialize against them — it has to be this row.
          const [organization] = await trx
            .select({
              studentCount: OrganizationsTable.studentCount,
              courseCount: OrganizationsTable.courseCount,
              storageBytes: OrganizationsTable.storageBytes,
            })
            .from(OrganizationsTable)
            .where(eq(OrganizationsTable.id, organizationId))
            .for("update");

          // Deleted between the fan-out and this run. Retrying won't help.
          if (!organization) {
            return { discrepancies: [], storageSkipped: null };
          }

          const counted = await countOrganizationUsage(trx, organizationId);

          // Storage was measured against a bucket that has since been written
          // to (or the read before the measurement never found the org).
          // Writing the measured total now would drop whatever that upload
          // charged, so leave it for the next run rather than correct it into
          // a worse number.
          const storageMoved =
            storageBytesBeforeMeasuring === null ||
            organization.storageBytes !== storageBytesBeforeMeasuring;
          const storageSkipped: StorageSkipReason | null =
            measured.skipped ??
            (storageMoved ? "changed-during-measurement" : null);

          const discrepancies = computeUsageDrift(organization, {
            ...counted,
            storageBytes: storageSkipped === null ? measured.bytes : null,
          });

          if (discrepancies.length > 0) {
            await trx
              .update(OrganizationsTable)
              .set(toUsageCorrection(discrepancies))
              .where(eq(OrganizationsTable.id, organizationId));
          }

          return { discrepancies, storageSkipped };
        });
      },
    );

    // Corrections are logged, never silent: drift means some write path
    // failed to keep its counter honest, and the correction alone would hide
    // the bug that caused it.
    if (result.discrepancies.length > 0) {
      console.error(
        "Corrected plan usage drift",
        JSON.stringify({ organizationId, discrepancies: result.discrepancies }),
      );
    }

    return {
      organizationId,
      corrected: result.discrepancies.length,
      storageSkipped: result.storageSkipped,
    };
  },
);
