import { TRPCError } from "@trpc/server";
import type { TRPCContext } from "./init";
import { type BranchScope, pickWriteBranch } from "./org-access";

type WriteContext = Pick<BranchScope, "branchIds" | "activeBranchId"> & {
  t: TRPCContext["t"];
};

/**
 * The branch a new row is written to. A row created under a parent (a
 * session under a group, an enrollment for a trainee) takes the parent's
 * branch instead — use `assertBranchInScope` for that.
 */
export function requireWriteBranch(
  ctx: WriteContext,
  requestedBranchId?: string | null,
): string {
  const branchId = pickWriteBranch(ctx, requestedBranchId);
  if (branchId) return branchId;
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: ctx.t(
      requestedBranchId ? "errors.branchOutOfScope" : "errors.chooseBranch",
    ),
  });
}

/** Refuses to act on a row whose branch is outside the request's scope. */
export function assertBranchInScope(
  ctx: WriteContext,
  branchId: string,
): string {
  if (ctx.branchIds.includes(branchId)) return branchId;
  throw new TRPCError({ code: "NOT_FOUND", message: ctx.t("errors.notFound") });
}
