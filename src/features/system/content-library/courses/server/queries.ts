import { and, asc, count, desc, eq, ilike, isNull } from "drizzle-orm";
import { CoursesTable } from "@/drizzle/schema";
import type { ListCoursesInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

function buildWhereClause(ctx: OrgTRPCContext, input: ListCoursesInput) {
  return and(
    eq(CoursesTable.organizationId, ctx.organizationId),
    isNull(CoursesTable.deletedAt),
    input.globalFilter?.trim()
      ? ilike(CoursesTable.name, `%${input.globalFilter.trim()}%`)
      : undefined,
  );
}

// Every branch appends `id` as a tiebreaker so ties in the primary sort don't
// leave row order (and therefore offset pagination) nondeterministic — same
// pattern as demo_items' queries.ts (STATE.md D35).
function sortExpr(input: ListCoursesInput) {
  const firstSort = input.sorting[0];
  if (!firstSort) return [asc(CoursesTable.name), asc(CoursesTable.id)];

  switch (firstSort.id) {
    case "createdAt":
      return [
        firstSort.desc
          ? desc(CoursesTable.createdAt)
          : asc(CoursesTable.createdAt),
        asc(CoursesTable.id),
      ];
    default:
      return [
        firstSort.desc ? desc(CoursesTable.name) : asc(CoursesTable.name),
        asc(CoursesTable.id),
      ];
  }
}

export async function listCourses(
  ctx: OrgTRPCContext,
  input: ListCoursesInput,
) {
  const whereClause = buildWhereClause(ctx, input);

  const [{ value: total }] = await ctx.db
    .select({ value: count() })
    .from(CoursesTable)
    .where(whereClause);

  const pageCount = Math.max(1, Math.ceil(Number(total) / input.perPage));
  const page = Math.min(input.page, pageCount);
  const offset = (page - 1) * input.perPage;

  const rows = await ctx.db
    .select()
    .from(CoursesTable)
    .where(whereClause)
    .orderBy(...sortExpr(input))
    .limit(input.perPage)
    .offset(offset);

  return { rows, page, pageCount, total: Number(total) };
}
