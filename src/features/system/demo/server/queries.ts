import { asc, count, desc, ilike } from "drizzle-orm";
import { DemoItemsTable } from "@/drizzle/schema";
import type { TRPCContext } from "@/integrations/trpc/init";
import type { ListDemoItemsInput } from "./schemas";

function buildWhereClause(input: ListDemoItemsInput) {
  const query = input.globalFilter?.trim();
  if (!query) return undefined;
  return ilike(DemoItemsTable.name, `%${query}%`);
}

// Every branch appends `id` as a tiebreaker so ties in the primary sort don't
// leave row order (and therefore offset pagination) nondeterministic.
function sortExpr(input: ListDemoItemsInput) {
  const firstSort = input.sorting[0];
  if (!firstSort) return [asc(DemoItemsTable.name), asc(DemoItemsTable.id)];

  switch (firstSort.id) {
    case "isActive":
      return [
        firstSort.desc
          ? desc(DemoItemsTable.isActive)
          : asc(DemoItemsTable.isActive),
        asc(DemoItemsTable.id),
      ];
    case "createdAt":
      return [
        firstSort.desc
          ? desc(DemoItemsTable.createdAt)
          : asc(DemoItemsTable.createdAt),
        asc(DemoItemsTable.id),
      ];
    default:
      return [
        firstSort.desc ? desc(DemoItemsTable.name) : asc(DemoItemsTable.name),
        asc(DemoItemsTable.id),
      ];
  }
}

export async function listDemoItems(
  ctx: TRPCContext,
  input: ListDemoItemsInput,
) {
  const whereClause = buildWhereClause(input);
  const [{ value: total }] = await ctx.db
    .select({ value: count() })
    .from(DemoItemsTable)
    .where(whereClause);

  const pageCount = Math.max(1, Math.ceil(Number(total) / input.perPage));
  const page = Math.min(input.page, pageCount);
  const offset = (page - 1) * input.perPage;

  const rows = await ctx.db
    .select()
    .from(DemoItemsTable)
    .where(whereClause)
    .orderBy(...sortExpr(input))
    .limit(input.perPage)
    .offset(offset);

  return { rows, page, pageCount, total: Number(total) };
}
