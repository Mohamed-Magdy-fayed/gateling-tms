import { TRPCError } from "@trpc/server";
import { and, asc, DrizzleQueryError, eq, inArray, ne } from "drizzle-orm";
import type { PostgresError } from "postgres";
import {
  BranchesTable,
  OrganizationMembershipBranchesTable,
  OrganizationMembershipsTable,
} from "@/drizzle/schema";
import type {
  CreateBranchInput,
  SetMemberBranchesInput,
  UpdateBranchInput,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

/**
 * Branch administration for Settings → Branches and member assignment
 * (docs/designs/academy-branches.md). Branches are never deleted — every
 * branch-owned row points at one — they're deactivated instead.
 */

const branchRowSelection = {
  id: BranchesTable.id,
  name: BranchesTable.name,
  address: BranchesTable.address,
  phone: BranchesTable.phone,
  isActive: BranchesTable.isActive,
  createdAt: BranchesTable.createdAt,
};

export type BranchRow = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
};

/** Every branch of the academy — the Settings list and the branch pickers. */
export async function listBranches(ctx: OrgTRPCContext): Promise<BranchRow[]> {
  return ctx.db
    .select(branchRowSelection)
    .from(BranchesTable)
    .where(eq(BranchesTable.organizationId, ctx.organizationId))
    .orderBy(asc(BranchesTable.createdAt), asc(BranchesTable.name));
}

/**
 * The branches this member may switch between, and the selected one (null =
 * All branches). Lists use it to decide whether to show a Branch column.
 */
export async function getBranchScope(ctx: OrgTRPCContext) {
  const branches =
    ctx.visibleBranchIds.length === 0
      ? []
      : await ctx.db
          .select({ id: BranchesTable.id, name: BranchesTable.name })
          .from(BranchesTable)
          .where(
            and(
              eq(BranchesTable.organizationId, ctx.organizationId),
              inArray(BranchesTable.id, ctx.visibleBranchIds),
            ),
          )
          .orderBy(asc(BranchesTable.createdAt), asc(BranchesTable.name));
  return { activeBranchId: ctx.activeBranchId, branches };
}

/**
 * The branches this member may pick when creating a row: the request's
 * scope, active ones only. A create form shows these when "All branches" is
 * selected (requireWriteBranch refuses to guess).
 */
export async function listWritableBranches(ctx: OrgTRPCContext) {
  if (ctx.branchIds.length === 0) return [];
  return ctx.db
    .select({ id: BranchesTable.id, name: BranchesTable.name })
    .from(BranchesTable)
    .where(
      and(
        eq(BranchesTable.organizationId, ctx.organizationId),
        inArray(BranchesTable.id, ctx.branchIds),
        eq(BranchesTable.isActive, true),
      ),
    )
    .orderBy(asc(BranchesTable.createdAt), asc(BranchesTable.name));
}

function nullableTrim(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function isBranchNameConflict(error: unknown): boolean {
  if (!(error instanceof DrizzleQueryError)) return false;
  const cause = error.cause as PostgresError | undefined;
  return (
    cause?.code === "23505" &&
    cause?.constraint_name === "branches_organization_id_name_unique"
  );
}

function nameTakenError(ctx: OrgTRPCContext) {
  return new TRPCError({
    code: "CONFLICT",
    message: ctx.t("organizations.branches.nameTaken"),
  });
}

export async function createBranch(
  ctx: OrgTRPCContext,
  input: CreateBranchInput,
) {
  try {
    const [branch] = await ctx.db
      .insert(BranchesTable)
      .values({
        organizationId: ctx.organizationId,
        name: input.name.trim(),
        address: nullableTrim(input.address),
        phone: nullableTrim(input.phone),
      })
      .returning({ id: BranchesTable.id });
    return branch;
  } catch (error) {
    if (isBranchNameConflict(error)) throw nameTakenError(ctx);
    throw error;
  }
}

export async function updateBranch(
  ctx: OrgTRPCContext,
  input: UpdateBranchInput,
) {
  return ctx.db.transaction(async (trx) => {
    const branch = await trx.query.BranchesTable.findFirst({
      where: and(
        eq(BranchesTable.id, input.branchId),
        eq(BranchesTable.organizationId, ctx.organizationId),
      ),
      columns: { isActive: true },
    });
    if (!branch) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    // An academy always keeps one active branch, so there is somewhere for
    // new students and groups to go.
    if (branch.isActive && !input.isActive) {
      const otherActive = await trx
        .select({ id: BranchesTable.id })
        .from(BranchesTable)
        .where(
          and(
            eq(BranchesTable.organizationId, ctx.organizationId),
            eq(BranchesTable.isActive, true),
            ne(BranchesTable.id, input.branchId),
          ),
        )
        .limit(1)
        .for("update");
      if (otherActive.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: ctx.t("organizations.branches.lastActive"),
        });
      }
    }

    try {
      await trx
        .update(BranchesTable)
        .set({
          name: input.name.trim(),
          address: nullableTrim(input.address),
          phone: nullableTrim(input.phone),
          isActive: input.isActive,
        })
        .where(
          and(
            eq(BranchesTable.id, input.branchId),
            eq(BranchesTable.organizationId, ctx.organizationId),
          ),
        );
    } catch (error) {
      if (isBranchNameConflict(error)) throw nameTakenError(ctx);
      throw error;
    }

    return { updated: true };
  });
}

/**
 * Replaces the branches a member works in. An empty list means "every
 * branch" (resolveBranchAccess), which is also what admins always get.
 */
export async function setMemberBranches(
  ctx: OrgTRPCContext,
  input: SetMemberBranchesInput,
) {
  const branchIds = [...new Set(input.branchIds)];

  await ctx.db.transaction(async (trx) => {
    const membership = await trx.query.OrganizationMembershipsTable.findFirst({
      where: and(
        eq(OrganizationMembershipsTable.organizationId, ctx.organizationId),
        eq(OrganizationMembershipsTable.userId, input.userId),
      ),
      columns: { userId: true },
    });
    if (!membership) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    if (branchIds.length > 0) {
      const owned = await trx
        .select({ id: BranchesTable.id })
        .from(BranchesTable)
        .where(
          and(
            eq(BranchesTable.organizationId, ctx.organizationId),
            inArray(BranchesTable.id, branchIds),
          ),
        );
      if (owned.length !== branchIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: ctx.t("errors.branchOutOfScope"),
        });
      }
    }

    await trx
      .delete(OrganizationMembershipBranchesTable)
      .where(
        and(
          eq(
            OrganizationMembershipBranchesTable.organizationId,
            ctx.organizationId,
          ),
          eq(OrganizationMembershipBranchesTable.userId, input.userId),
        ),
      );

    if (branchIds.length > 0) {
      await trx.insert(OrganizationMembershipBranchesTable).values(
        branchIds.map((branchId) => ({
          organizationId: ctx.organizationId,
          userId: input.userId,
          branchId,
        })),
      );
    }
  });

  return { updated: true };
}

/** userId → the branches they're assigned to, for the given members. */
export async function loadMemberBranchIds(
  ctx: Pick<OrgTRPCContext, "db" | "organizationId">,
  userIds: string[],
): Promise<Map<string, string[]>> {
  const byUser = new Map<string, string[]>();
  if (userIds.length === 0) return byUser;

  const rows = await ctx.db
    .select({
      userId: OrganizationMembershipBranchesTable.userId,
      branchId: OrganizationMembershipBranchesTable.branchId,
    })
    .from(OrganizationMembershipBranchesTable)
    .where(
      and(
        eq(
          OrganizationMembershipBranchesTable.organizationId,
          ctx.organizationId,
        ),
        inArray(OrganizationMembershipBranchesTable.userId, userIds),
      ),
    );

  for (const row of rows) {
    byUser.set(row.userId, [...(byUser.get(row.userId) ?? []), row.branchId]);
  }
  return byUser;
}
