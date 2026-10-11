import { inArray } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import type { BranchScope } from "./org-access";

/**
 * A list's branch condition: the request's branches, narrowed by the list's
 * Branch filter when one is set. Intersected rather than trusted, so a
 * filter can only ever narrow what the member may read.
 */
export function branchFilter(
  column: PgColumn,
  scope: Pick<BranchScope, "branchIds">,
  requested: string[] | undefined,
) {
  const branchIds = requested?.length
    ? scope.branchIds.filter((id) => requested.includes(id))
    : scope.branchIds;
  return inArray(column, branchIds);
}
