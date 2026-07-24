import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { OrganizationsTable } from "@/drizzle/schema";
import { assertStorageBudget } from "@/features/core/organizations/server";
import { deleteImage, uploadImage } from "@/integrations/firebase/storage";
import type { DeleteImageInput, UploadImageInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

// Approximates the decoded byte size from the base64 string length without
// actually decoding — only used for the pre-upload budget check, before the
// real file exists to measure. The post-upload accounting increment below
// uses uploadImage's exact decoded `bytes`, not this estimate.
function approximateDecodedBytes(base64: string): number {
  return Math.ceil((base64.length * 3) / 4);
}

export async function uploadOrgImage(
  ctx: OrgTRPCContext,
  input: UploadImageInput,
) {
  // Budget check is a quick, lock-free read — deliberately NOT held across
  // the actual upload below. Locking the organization row for the duration
  // of an external network call (Firebase) would stall every other request
  // touching that org for as long as the upload takes; the tradeoff is a
  // small TOCTOU window where two concurrent uploads can both pass the
  // check before either's `storageBytes` increment commits, same category
  // as accepting a race in exchange for not holding a lock across I/O.
  // Unlike courses/server/mutations.ts's createCourse (STATE.md D63), which
  // locks because its own work is DB-only. See STATE.md D70.
  const organization = await ctx.db.query.OrganizationsTable.findFirst({
    where: eq(OrganizationsTable.id, ctx.organizationId),
    columns: { plan: true, storageBytes: true },
  });

  if (!organization) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.noActiveOrganization"),
    });
  }

  assertStorageBudget(ctx, organization, approximateDecodedBytes(input.base64));

  const { url, bytes } = await uploadImage(
    input.base64,
    input.mimeType,
    `orgs/${ctx.organizationId}/${input.folder}`,
  );

  await ctx.db
    .update(OrganizationsTable)
    .set({ storageBytes: sql`${OrganizationsTable.storageBytes} + ${bytes}` })
    .where(eq(OrganizationsTable.id, ctx.organizationId));

  return { url, bytes };
}

// Best-effort: removes the object and refunds the org's storage accounting
// by the object's *actual* size (read from Firebase's own metadata, not an
// estimate — see deleteImage's own comment). Callers (course thumbnail
// replace, lecture attachment remove) already verify the URL belongs to
// their own org-scoped record before calling this — deleteImage itself
// no-ops on a URL outside this bucket's own prefix.
export async function deleteOrgImage(
  ctx: OrgTRPCContext,
  input: DeleteImageInput,
) {
  const freedBytes = await deleteImage(input.url);

  if (freedBytes > 0) {
    await ctx.db
      .update(OrganizationsTable)
      .set({
        storageBytes: sql`greatest(${OrganizationsTable.storageBytes} - ${freedBytes}, 0)`,
      })
      .where(eq(OrganizationsTable.id, ctx.organizationId));
  }

  return { deleted: true };
}
