import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, ilike, isNull } from "drizzle-orm";
import { likeContains } from "@/drizzle/lib/search";
import { ZoomClientsTable } from "@/drizzle/schema";
import type { ListZoomClientsInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

/**
 * Never includes `accessToken`/`refreshToken`/`accessTokenExpiresAt`. Those
 * are encrypted at rest, but a connected Zoom account is still a credential
 * for someone else's system — nothing outside this server module has a reason
 * to see it, so the shape the client gets can't carry it by accident.
 */
const zoomClientListColumns = {
  id: ZoomClientsTable.id,
  name: ZoomClientsTable.name,
  status: ZoomClientsTable.status,
  zoomEmail: ZoomClientsTable.zoomEmail,
  zoomAccountId: ZoomClientsTable.zoomAccountId,
  lastError: ZoomClientsTable.lastError,
  createdAt: ZoomClientsTable.createdAt,
} as const;

export type ZoomClientListRow = {
  [K in keyof typeof zoomClientListColumns]: (typeof ZoomClientsTable)["$inferSelect"][K];
};

function buildWhereClause(ctx: OrgTRPCContext, input: ListZoomClientsInput) {
  const search = input.globalFilter?.trim();

  return and(
    eq(ZoomClientsTable.organizationId, ctx.organizationId),
    isNull(ZoomClientsTable.deletedAt),
    search ? ilike(ZoomClientsTable.name, likeContains(search)) : undefined,
  );
}

// Every branch appends `id` as a tiebreaker so ties in the primary sort don't
// leave row order (and therefore offset pagination) nondeterministic — same
// pattern as groups'/trainees' queries.ts (STATE.md D35).
function sortExpr(input: ListZoomClientsInput) {
  const firstSort = input.sorting[0];
  if (!firstSort) {
    return [desc(ZoomClientsTable.createdAt), asc(ZoomClientsTable.id)];
  }

  switch (firstSort.id) {
    case "name":
      return [
        firstSort.desc
          ? desc(ZoomClientsTable.name)
          : asc(ZoomClientsTable.name),
        asc(ZoomClientsTable.id),
      ];
    case "status":
      return [
        firstSort.desc
          ? desc(ZoomClientsTable.status)
          : asc(ZoomClientsTable.status),
        asc(ZoomClientsTable.id),
      ];
    default:
      return [
        firstSort.desc
          ? desc(ZoomClientsTable.createdAt)
          : asc(ZoomClientsTable.createdAt),
        asc(ZoomClientsTable.id),
      ];
  }
}

export async function listZoomClients(
  ctx: OrgTRPCContext,
  input: ListZoomClientsInput,
) {
  const whereClause = buildWhereClause(ctx, input);

  const [{ value: total }] = await ctx.db
    .select({ value: count() })
    .from(ZoomClientsTable)
    .where(whereClause);

  const pageCount = Math.max(1, Math.ceil(Number(total) / input.perPage));
  const page = Math.min(input.page, pageCount);
  const offset = (page - 1) * input.perPage;

  const rows = await ctx.db
    .select(zoomClientListColumns)
    .from(ZoomClientsTable)
    .where(whereClause)
    .orderBy(...sortExpr(input))
    .limit(input.perPage)
    .offset(offset);

  return { rows, page, pageCount, total: Number(total) };
}

export async function getZoomClient(ctx: OrgTRPCContext, id: string) {
  const [zoomClient] = await ctx.db
    .select(zoomClientListColumns)
    .from(ZoomClientsTable)
    .where(
      and(
        eq(ZoomClientsTable.id, id),
        eq(ZoomClientsTable.organizationId, ctx.organizationId),
        isNull(ZoomClientsTable.deletedAt),
      ),
    );

  if (!zoomClient) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return zoomClient;
}
