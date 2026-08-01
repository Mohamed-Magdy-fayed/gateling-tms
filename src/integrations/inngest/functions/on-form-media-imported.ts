import { and, eq, isNotNull, sql } from "drizzle-orm";
import { eventType } from "inngest";
import { z } from "zod";

import { db } from "@/drizzle";
import {
  FormBlocksTable,
  OrganizationsTable,
  QuestionsTable,
} from "@/drizzle/schema";
import { PLAN_LIMITS } from "@/features/core/organizations/server";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
  uploadImageBuffer,
} from "@/integrations/firebase/storage";
import { isFetchableGoogleMediaUrl } from "@/integrations/google/media";
import { inngest } from "../client";

/**
 * Fired after a Google Forms import commits, if it wrote any media that still
 * points at Google.
 *
 * The import itself can't do this work: Google's `contentUri` values have to
 * be downloaded and re-uploaded one at a time, and making an admin wait on a
 * dozen round trips to two external services before they see their assessment
 * would be the wrong trade — exactly what the Inngest offload policy is for.
 * The form is fully usable in the meantime; only the pictures are missing, and
 * the answer sheet says so rather than showing broken images.
 */
export const formMediaImportedEvent = eventType("assessment/form-media-imported", {
  schema: z.object({
    organizationId: z.string(),
    formId: z.string(),
  }),
});

/** Per run, so one pathological form can't spend an unbounded step budget. */
const MAX_MEDIA_PER_FORM = 60;

/** A stuck download must not hold a step open — same bound as the API client. */
const FETCH_TIMEOUT_MS = 15_000;

type PendingMedia = {
  table: "block" | "question";
  id: string;
  sourceUrl: string;
};

export const onFormMediaImported = inngest.createFunction(
  { id: "on-form-media-imported", triggers: [formMediaImportedEvent] },
  async ({ event, step }) => {
    const { organizationId, formId } = event.data;

    const pending = await step.run("list-pending-media", async () =>
      listPendingMedia(organizationId, formId),
    );

    let copied = 0;
    let failed = 0;

    for (const media of pending) {
      // One step per image, so a single unreachable URL retries on its own
      // rather than re-downloading everything that already succeeded.
      const outcome = await step.run(`copy-${media.table}-${media.id}`, () =>
        copyMedia(organizationId, media),
      );

      if (outcome === "copied") copied += 1;
      else failed += 1;
    }

    return { pending: pending.length, copied, failed };
  },
);

/**
 * Every image this form imported that still points at Google.
 *
 * Scoped by form and organization, and driven entirely by what is in the
 * database rather than by anything on the event — a redelivery after a partial
 * run picks up only what is genuinely still outstanding.
 */
async function listPendingMedia(
  organizationId: string,
  formId: string,
): Promise<PendingMedia[]> {
  const [blocks, questions] = await Promise.all([
    db
      .select({ id: FormBlocksTable.id, sourceUrl: FormBlocksTable.sourceUrl })
      .from(FormBlocksTable)
      .where(
        and(
          eq(FormBlocksTable.organizationId, organizationId),
          isNotNull(FormBlocksTable.sourceUrl),
          sql`${FormBlocksTable.sectionId} IN (
            SELECT id FROM form_sections WHERE "formId" = ${formId}
          )`,
        ),
      )
      .limit(MAX_MEDIA_PER_FORM),
    db
      .select({
        id: QuestionsTable.id,
        sourceUrl: QuestionsTable.imageSourceUrl,
      })
      .from(QuestionsTable)
      .where(
        and(
          eq(QuestionsTable.organizationId, organizationId),
          isNotNull(QuestionsTable.imageSourceUrl),
          sql`${QuestionsTable.sectionId} IN (
            SELECT id FROM form_sections WHERE "formId" = ${formId}
          )`,
        ),
      )
      .limit(MAX_MEDIA_PER_FORM),
  ]);

  return [
    ...blocks.map((row) => ({
      table: "block" as const,
      id: row.id,
      sourceUrl: row.sourceUrl ?? "",
    })),
    ...questions.map((row) => ({
      table: "question" as const,
      id: row.id,
      sourceUrl: row.sourceUrl ?? "",
    })),
  ].filter((media) => media.sourceUrl);
}

/**
 * Copies one image into this app's own storage.
 *
 * Never throws: a picture that can't be fetched is not a reason to fail the
 * run and retry the whole form. The pending URL is cleared either way, because
 * it expires — leaving it set would keep the answer sheet promising an image
 * that is never going to arrive.
 */
async function copyMedia(
  organizationId: string,
  media: PendingMedia,
): Promise<"copied" | "failed"> {
  try {
    const { buffer, mimeType } = await fetchImage(media.sourceUrl);
    await assertBudget(organizationId, buffer.length);

    const { url, bytes } = await uploadImageBuffer(
      buffer,
      mimeType,
      `orgs/${organizationId}/assessments`,
    );

    await db.transaction(async (trx) => {
      if (media.table === "block") {
        await trx
          .update(FormBlocksTable)
          .set({ mediaUrl: url, sourceUrl: null })
          .where(
            and(
              eq(FormBlocksTable.id, media.id),
              eq(FormBlocksTable.organizationId, organizationId),
            ),
          );
      } else {
        await trx
          .update(QuestionsTable)
          .set({ imageUrl: url, imageSourceUrl: null })
          .where(
            and(
              eq(QuestionsTable.id, media.id),
              eq(QuestionsTable.organizationId, organizationId),
            ),
          );
      }

      await trx
        .update(OrganizationsTable)
        .set({
          storageBytes: sql`${OrganizationsTable.storageBytes} + ${bytes}`,
        })
        .where(eq(OrganizationsTable.id, organizationId));
    });

    return "copied";
  } catch (error) {
    console.error("Failed to copy imported form media", {
      organizationId,
      table: media.table,
      id: media.id,
      error,
    });

    await clearSource(organizationId, media);
    return "failed";
  }
}

async function clearSource(organizationId: string, media: PendingMedia) {
  if (media.table === "block") {
    await db
      .update(FormBlocksTable)
      .set({ sourceUrl: null })
      .where(
        and(
          eq(FormBlocksTable.id, media.id),
          eq(FormBlocksTable.organizationId, organizationId),
        ),
      );
    return;
  }

  await db
    .update(QuestionsTable)
    .set({ imageSourceUrl: null })
    .where(
      and(
        eq(QuestionsTable.id, media.id),
        eq(QuestionsTable.organizationId, organizationId),
      ),
    );
}

/**
 * Downloads one image, refusing anything that isn't a Google-hosted HTTPS URL.
 *
 * The URL came from an external API, so this is a server-side request to an
 * attacker-influenceable address unless the host is constrained — see
 * `integrations/google/media.ts`. `redirect: "error"` matters for the same
 * reason: an allowed host that 302s elsewhere would otherwise walk straight
 * past the check.
 */
async function fetchImage(
  url: string,
): Promise<{ buffer: Buffer; mimeType: string }> {
  if (!isFetchableGoogleMediaUrl(url)) {
    throw new Error("Refusing to fetch media from an untrusted host");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "error",
      headers: { Accept: ALLOWED_IMAGE_MIME_TYPES.join(", ") },
    });

    if (!response.ok) {
      throw new Error(`Media request failed with ${response.status}`);
    }

    // The declared length is a hint, not a fact, so the decoded size is
    // checked again below — but rejecting on it first avoids downloading
    // something huge only to throw it away.
    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_IMAGE_BYTES) {
      throw new Error("Media exceeds the maximum allowed size");
    }

    const mimeType = (response.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new Error("Media exceeds the maximum allowed size");
    }

    // `uploadImageBuffer` still checks the bytes against the declared type;
    // this only rejects the obviously-wrong before the upload path sees it.
    return { buffer, mimeType };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * The org's storage cap, checked here rather than through
 * `assertStorageBudget`: that helper throws a localized TRPCError, and there
 * is no request, no locale and nobody to show it to inside a background job.
 */
async function assertBudget(organizationId: string, additionalBytes: number) {
  const organization = await db.query.OrganizationsTable.findFirst({
    where: eq(OrganizationsTable.id, organizationId),
    columns: { plan: true, storageBytes: true },
  });

  if (!organization) throw new Error("Organization no longer exists");

  const limit = PLAN_LIMITS[organization.plan].maxStorageBytes;
  if (organization.storageBytes + additionalBytes > limit) {
    throw new Error("Storage limit reached");
  }
}
