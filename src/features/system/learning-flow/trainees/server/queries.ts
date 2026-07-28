import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { TraineesTable } from "@/drizzle/schema";
import type { ListTraineesInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

function buildWhereClause(ctx: OrgTRPCContext, input: ListTraineesInput) {
  const search = input.globalFilter?.trim();

  return and(
    eq(TraineesTable.organizationId, ctx.organizationId),
    isNull(TraineesTable.deletedAt),
    search
      ? or(
          ilike(TraineesTable.name, `%${search}%`),
          ilike(TraineesTable.email, `%${search}%`),
          ilike(TraineesTable.phone, `%${search}%`),
        )
      : undefined,
  );
}

// Every branch appends `id` as a tiebreaker so ties in the primary sort don't
// leave row order (and therefore offset pagination) nondeterministic — same
// pattern as courses' queries.ts (STATE.md D35).
function sortExpr(input: ListTraineesInput) {
  const firstSort = input.sorting[0];
  if (!firstSort) return [asc(TraineesTable.name), asc(TraineesTable.id)];

  switch (firstSort.id) {
    case "createdAt":
      return [
        firstSort.desc
          ? desc(TraineesTable.createdAt)
          : asc(TraineesTable.createdAt),
        asc(TraineesTable.id),
      ];
    default:
      return [
        firstSort.desc ? desc(TraineesTable.name) : asc(TraineesTable.name),
        asc(TraineesTable.id),
      ];
  }
}

export async function listTrainees(
  ctx: OrgTRPCContext,
  input: ListTraineesInput,
) {
  const whereClause = buildWhereClause(ctx, input);

  const [{ value: total }] = await ctx.db
    .select({ value: count() })
    .from(TraineesTable)
    .where(whereClause);

  const pageCount = Math.max(1, Math.ceil(Number(total) / input.perPage));
  const page = Math.min(input.page, pageCount);
  const offset = (page - 1) * input.perPage;

  const rows = await ctx.db
    .select()
    .from(TraineesTable)
    .where(whereClause)
    .orderBy(...sortExpr(input))
    .limit(input.perPage)
    .offset(offset);

  return { rows, page, pageCount, total: Number(total) };
}

export async function getTrainee(ctx: OrgTRPCContext, id: string) {
  const trainee = await ctx.db.query.TraineesTable.findFirst({
    where: and(
      eq(TraineesTable.id, id),
      eq(TraineesTable.organizationId, ctx.organizationId),
      isNull(TraineesTable.deletedAt),
    ),
  });

  if (!trainee) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return trainee;
}
