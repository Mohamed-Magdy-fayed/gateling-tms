import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { eventType } from "inngest";
import { z } from "zod";

import { db } from "@/drizzle";
import {
  FormBlocksTable,
  FormSectionsTable,
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

/** Per query per run, so one pathological form cannot spend an unbounded step
 * budget in a single execution. Anything beyond it is re-queued. */
const MAX_MEDIA_PER_QUERY = 60;

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

    const { media: pending, hasMore } = await step.run(
      "list-pending-media",
      async () => listPendingMedia(organizationId, formId),
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

    // A form with more media than one run may claim would otherwise leave the
    // rest pending against URLs that expire. Re-queued rather than looped so
    // each batch gets its own step budget — and only when this run actually
    // settled something, so a batch that can neither copy nor clear can't
    // re-trigger itself forever.
    if (hasMore && copied + failed > 0) {
      await step.sendEvent(
        "continue-media-import",
        formMediaImportedEvent.create({ organizationId, formId }),
      );
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
): Promise<{ media: PendingMedia[]; hasMore: boolean }> {
  // The section ids are resolved first, scoped by organization as well as
  // form: the raw `IN (SELECT … FROM form_sections)` this replaces hardcoded
  // both the table and the quoted column name that the Drizzle schema owns,
  // and left the tenancy check to the outer query alone.
  const sections = await db
    .select({ id: FormSectionsTable.id })
    .from(FormSectionsTable)
    .where(
      and(
        eq(FormSectionsTable.formId, formId),
        eq(FormSectionsTable.organizationId, organizationId),
      ),
    );

  const sectionIds = sections.map((section) => section.id);
  if (sectionIds.length === 0) return { media: [], hasMore: false };

  const [blocks, questions] = await Promise.all([
    db
      .select({ id: FormBlocksTable.id, sourceUrl: FormBlocksTable.sourceUrl })
      .from(FormBlocksTable)
      .where(
        and(
          eq(FormBlocksTable.organizationId, organizationId),
          isNotNull(FormBlocksTable.sourceUrl),
          inArray(FormBlocksTable.sectionId, sectionIds),
        ),
      )
      .limit(MAX_MEDIA_PER_QUERY),
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
          inArray(QuestionsTable.sectionId, sectionIds),
        ),
      )
      .limit(MAX_MEDIA_PER_QUERY),
  ]);

  const media = [
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
  ].filter((item) => item.sourceUrl);

  return {
    media,
    // Either query filling its page means there is more behind it.
    hasMore:
      blocks.length === MAX_MEDIA_PER_QUERY ||
      questions.length === MAX_MEDIA_PER_QUERY,
  };
}

/**
 * A failure that retrying cannot fix: an untrusted host, an oversized or
 * non-image body, a full storage plan. These clear the pending URL and move
 * on. Anything else — a network blip, Firebase being briefly unavailable, the
 * database refusing a connection — is thrown so Inngest retries the step,
 * because returning normally marks the step *successful* and it never runs
 * again.
 */
class PermanentMediaFailure extends Error {}

/**
 * `uploadImageBuffer` rejects with a `BAD_REQUEST` TRPCError when the type is
 * not allowed, the bytes exceed the cap, or they don't match the declared
 * type. None of those improve on a retry — re-thrown as-is they would have
 * Inngest re-download the same image on every attempt and then fail the run
 * with the pending URL still set.
 */
function asPermanentIfRejected(error: unknown): never {
  const code = (error as { code?: string } | undefined)?.code;
  if (code === "BAD_REQUEST") {
    throw new PermanentMediaFailure(
      error instanceof Error ? error.message : "Upload rejected the image",
    );
  }
  throw error;
}

/**
 * Copies one image into this app's own storage.
 *
 * Returns "failed" only for failures that will never succeed; everything else
 * propagates and is retried. The pending URL is cleared on a permanent failure
 * because it expires — leaving it set would keep the answer sheet promising an
 * image that is never going to arrive.
 */
async function copyMedia(
  organizationId: string,
  media: PendingMedia,
): Promise<"copied" | "failed"> {
  try {
    const { buffer, mimeType } = await fetchImage(media.sourceUrl);

    // Reserved *before* the upload and against the row itself, so two media
    // jobs for the same organization cannot both read the same total, both
    // pass, and together exceed the plan. A refund follows if the upload or
    // the write then fails.
    await reserveStorage(organizationId, buffer.length);

    let url: string;
    let bytes: number;
    let claimed: boolean;
    try {
      ({ url, bytes } = await uploadImageBuffer(
        buffer,
        mimeType,
        `orgs/${organizationId}/assessments`,
      ).catch(asPermanentIfRejected));

      claimed = await claimMedia(organizationId, media, url);
    } catch (error) {
      await releaseStorage(organizationId, buffer.length);
      throw error;
    }

    // Nobody is pointing at what was just uploaded: the author edited the
    // block or question while the copy was in flight, so their choice stands
    // and this copy is waste. Give the bytes back rather than charging the org
    // for an object no row references.
    if (!claimed) {
      await releaseStorage(organizationId, buffer.length);
      return "failed";
    }

    // The reservation was made on the downloaded length; the upload reports
    // what it actually stored. They agree today, but settling the difference
    // keeps the counter honest if that ever stops being true.
    if (bytes !== buffer.length) {
      await releaseStorage(organizationId, buffer.length - bytes);
    }

    return "copied";
  } catch (error) {
    if (!(error instanceof PermanentMediaFailure)) throw error;

    console.error("Gave up copying imported form media", {
      organizationId,
      table: media.table,
      id: media.id,
      reason: error.message,
    });

    await clearSource(organizationId, media);
    return "failed";
  }
}

/**
 * Writes the permanent URL, but only while the row still points at the source
 * this copy started from.
 *
 * Without that condition, an author who edited the block while the copy was in
 * flight — swapped the picture, or turned it into a text block — would have
 * their edit silently overwritten by the image they had just replaced.
 */
async function claimMedia(
  organizationId: string,
  media: PendingMedia,
  url: string,
): Promise<boolean> {
  if (media.table === "block") {
    const claimed = await db
      .update(FormBlocksTable)
      .set({ mediaUrl: url, sourceUrl: null })
      .where(
        and(
          eq(FormBlocksTable.id, media.id),
          eq(FormBlocksTable.organizationId, organizationId),
          eq(FormBlocksTable.sourceUrl, media.sourceUrl),
        ),
      )
      .returning({ id: FormBlocksTable.id });

    return claimed.length > 0;
  }

  const claimed = await db
    .update(QuestionsTable)
    .set({ imageUrl: url, imageSourceUrl: null })
    .where(
      and(
        eq(QuestionsTable.id, media.id),
        eq(QuestionsTable.organizationId, organizationId),
        eq(QuestionsTable.imageSourceUrl, media.sourceUrl),
      ),
    )
    .returning({ id: QuestionsTable.id });

  return claimed.length > 0;
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
    throw new PermanentMediaFailure("Media host is not trusted");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "error",
      headers: { Accept: ALLOWED_IMAGE_MIME_TYPES.join(", ") },
    });

    // 4xx is the URL itself being wrong or expired and will not improve; 5xx
    // and network errors are worth another attempt.
    if (!response.ok) {
      const message = `Media request failed with ${response.status}`;
      if (response.status < 500) throw new PermanentMediaFailure(message);
      throw new Error(message);
    }

    // A hint, not a fact — an allowed host can omit it or lie — so rejecting
    // on it only saves the download when it happens to be honest.
    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_IMAGE_BYTES) {
      throw new PermanentMediaFailure("Media exceeds the maximum allowed size");
    }

    const mimeType = (response.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();

    // `uploadImageBuffer` still checks the bytes against the declared type;
    // this only rejects the obviously-wrong before the upload path sees it.
    return { buffer: await readCapped(response), mimeType };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Reads the body a chunk at a time, giving up the moment it passes the cap.
 *
 * `response.arrayBuffer()` would allocate the whole thing first, so a host
 * that omits or understates `content-length` could exhaust the worker's memory
 * before any size check ran.
 */
async function readCapped(response: Response): Promise<Buffer> {
  if (!response.body) {
    throw new PermanentMediaFailure("Media response had no body");
  }

  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
    total += chunk.byteLength;
    if (total > MAX_IMAGE_BYTES) {
      await response.body.cancel().catch(() => {});
      throw new PermanentMediaFailure("Media exceeds the maximum allowed size");
    }
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks, total);
}

/**
 * Takes the bytes out of the organization's storage allowance, or refuses.
 *
 * One conditional UPDATE rather than read-then-check-then-write: two media
 * jobs for the same organization would otherwise both read the same total,
 * both decide there was room, and together go over the plan limit. Postgres
 * serializes the row update, so exactly one of them loses.
 */
async function reserveStorage(organizationId: string, bytes: number) {
  const organization = await db.query.OrganizationsTable.findFirst({
    where: eq(OrganizationsTable.id, organizationId),
    columns: { plan: true },
  });

  if (!organization) {
    throw new PermanentMediaFailure("Organization no longer exists");
  }

  const limit = PLAN_LIMITS[organization.plan].maxStorageBytes;

  const reserved = await db
    .update(OrganizationsTable)
    .set({ storageBytes: sql`${OrganizationsTable.storageBytes} + ${bytes}` })
    .where(
      and(
        eq(OrganizationsTable.id, organizationId),
        sql`${OrganizationsTable.storageBytes} + ${bytes} <= ${limit}`,
      ),
    )
    .returning({ id: OrganizationsTable.id });

  if (reserved.length === 0) {
    throw new PermanentMediaFailure("Storage limit reached");
  }
}

/** Hands reserved bytes back after a failed upload or an overestimate. */
async function releaseStorage(organizationId: string, bytes: number) {
  if (bytes <= 0) return;

  await db
    .update(OrganizationsTable)
    .set({
      storageBytes: sql`greatest(${OrganizationsTable.storageBytes} - ${bytes}, 0)`,
    })
    .where(eq(OrganizationsTable.id, organizationId));
}
