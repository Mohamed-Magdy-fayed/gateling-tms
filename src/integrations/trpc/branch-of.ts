import { TRPCError } from "@trpc/server";
import { and, eq, getTableColumns, inArray } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import type { db as database, Transaction } from "@/drizzle";
import {
  EnrollmentsTable,
  GroupsTable,
  SessionsTable,
  TraineesTable,
} from "@/drizzle/schema";
import type { TRPCContext } from "./init";
import type { BranchScope } from "./org-access";

/** The parent tables a branch-owned row inherits its branch from. */
const parents = {
  trainee: TraineesTable,
  enrollment: EnrollmentsTable,
  group: GroupsTable,
  session: SessionsTable,
} as const;

type BranchOfContext = Pick<BranchScope, "branchIds"> & {
  organizationId: string;
  t: TRPCContext["t"];
};

/**
 * The branch of a parent row (a trainee, enrollment, group or class), looked
 * up inside the request's scope. A new child row — an enrollment, a payment, a
 * roster entry, an attendance mark — always takes its parent's branch, never
 * one from input. A parent outside the scope is NOT_FOUND, exactly like any
 * other row the member can't see.
 */
export async function branchOf(
  reader: typeof database | Transaction,
  ctx: BranchOfContext,
  parent: keyof typeof parents,
  id: string,
): Promise<string> {
  const table = parents[parent];
  const cols = getTableColumns(table) as Record<string, AnyPgColumn>;
  const [row] = await reader
    .select({ branchId: cols.branchId })
    .from(table)
    .where(
      and(
        eq(cols.id, id),
        eq(cols.organizationId, ctx.organizationId),
        inArray(cols.branchId, ctx.branchIds),
      ),
    )
    .limit(1);

  if (!row) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }
  return row.branchId as string;
}
