import { TRPCError } from "@trpc/server";
import { and, eq, inArray, isNull } from "drizzle-orm";
import {
  CoursesTable,
  GroupStudentsTable,
  GroupsTable,
  OrganizationMembershipsTable,
  TraineesTable,
} from "@/drizzle/schema";
import { inngest } from "@/integrations/inngest/client";
import { groupScheduleChangedEvent } from "@/integrations/inngest/functions/on-group-schedule-changed";
import type {
  GroupAddStudentsInput,
  GroupDeleteInput,
  GroupMutationInput,
  GroupRemoveStudentInput,
  GroupUpdateInput,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

/**
 * A group's `courseId` uses a composite (organizationId, courseId) FK, but
 * `teacherId` is a plain FK to users — nothing at the database level stops it
 * pointing at a user outside the org. Both are checked here so the rule lives
 * in one place regardless of which constraint backs it.
 */
async function assertReferencesBelongToOrg(
  ctx: OrgTRPCContext,
  input: { courseId?: string | null; teacherId?: string | null },
) {
  if (input.courseId) {
    const course = await ctx.db.query.CoursesTable.findFirst({
      where: and(
        eq(CoursesTable.id, input.courseId),
        eq(CoursesTable.organizationId, ctx.organizationId),
        isNull(CoursesTable.deletedAt),
      ),
      columns: { id: true },
    });

    if (!course) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("groups.courseNotFound"),
      });
    }
  }

  if (input.teacherId) {
    const membership =
      await ctx.db.query.OrganizationMembershipsTable.findFirst({
        where: and(
          eq(OrganizationMembershipsTable.userId, input.teacherId),
          eq(OrganizationMembershipsTable.organizationId, ctx.organizationId),
        ),
        columns: { userId: true },
      });

    if (!membership) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("groups.teacherNotFound"),
      });
    }
  }
}

/**
 * Session generation is deliberately fire-and-forget: a group with its roster
 * is already useful, and blocking the create on a queue round trip would
 * undercut the instant-onboarding promise. A failed enqueue is logged and
 * surfaced as a warning flag the client can act on, not an error that hides
 * the group that was genuinely created.
 */
async function requestSessionRegeneration(
  ctx: OrgTRPCContext,
  groupId: string,
): Promise<boolean> {
  try {
    await inngest.send(
      groupScheduleChangedEvent.create({
        organizationId: ctx.organizationId,
        groupId,
      }),
    );
    return true;
  } catch (error) {
    console.error("Failed to enqueue group/schedule-changed event", {
      groupId,
      organizationId: ctx.organizationId,
      error,
    });
    return false;
  }
}

export async function createGroup(
  ctx: OrgTRPCContext,
  input: GroupMutationInput,
) {
  await assertReferencesBelongToOrg(ctx, input);

  const [group] = await ctx.db
    .insert(GroupsTable)
    .values({
      organizationId: ctx.organizationId,
      name: input.name,
      courseId: input.courseId ?? null,
      teacherId: input.teacherId ?? null,
      status: input.status,
      startDate: input.startDate,
      sessionCount: input.sessionCount,
      schedule: input.schedule,
    })
    .returning({ id: GroupsTable.id });

  const sessionsQueued = await requestSessionRegeneration(ctx, group.id);

  return { id: group.id, sessionsQueued };
}

export async function updateGroup(
  ctx: OrgTRPCContext,
  input: GroupUpdateInput,
) {
  await assertReferencesBelongToOrg(ctx, input);

  const [updated] = await ctx.db
    .update(GroupsTable)
    .set({
      name: input.name,
      courseId: input.courseId ?? null,
      teacherId: input.teacherId ?? null,
      status: input.status,
      startDate: input.startDate,
      sessionCount: input.sessionCount,
      schedule: input.schedule,
    })
    .where(
      and(
        eq(GroupsTable.id, input.id),
        eq(GroupsTable.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: GroupsTable.id });

  if (!updated) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  // Always re-requested rather than diffed against the previous row: the
  // handler is idempotent and only rewrites what actually changed, so a
  // redundant run is cheaper than getting a staleness check subtly wrong.
  const sessionsQueued = await requestSessionRegeneration(ctx, input.id);

  return { updated: true, sessionsQueued };
}

// Hard delete — unlike courses/trainees, `groups` carries no soft-delete
// columns. Roster rows and generated sessions go with it via ON DELETE
// CASCADE; a trainee's own record and their enrollments are untouched.
export async function deleteGroup(
  ctx: OrgTRPCContext,
  input: GroupDeleteInput,
) {
  const [deleted] = await ctx.db
    .delete(GroupsTable)
    .where(
      and(
        eq(GroupsTable.id, input.id),
        eq(GroupsTable.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: GroupsTable.id });

  if (!deleted) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { deleted: true };
}

export async function addGroupStudents(
  ctx: OrgTRPCContext,
  input: GroupAddStudentsInput,
) {
  return ctx.db.transaction(async (trx) => {
    const [group] = await trx
      .select({ id: GroupsTable.id })
      .from(GroupsTable)
      .where(
        and(
          eq(GroupsTable.id, input.groupId),
          eq(GroupsTable.organizationId, ctx.organizationId),
        ),
      );

    if (!group) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("errors.notFound"),
      });
    }

    // Filtering to trainees that actually exist in this org (and aren't soft
    // deleted) is what stops a crafted request adding another org's trainee,
    // and keeps a stale client list from failing the whole batch.
    const trainees = await trx
      .select({ id: TraineesTable.id })
      .from(TraineesTable)
      .where(
        and(
          inArray(TraineesTable.id, input.traineeIds),
          eq(TraineesTable.organizationId, ctx.organizationId),
          isNull(TraineesTable.deletedAt),
        ),
      );

    if (trainees.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: ctx.t("groups.noTraineesToAdd"),
      });
    }

    const inserted = await trx
      .insert(GroupStudentsTable)
      .values(
        trainees.map((trainee) => ({
          organizationId: ctx.organizationId,
          groupId: input.groupId,
          traineeId: trainee.id,
        })),
      )
      // Re-adding someone already on the roster is a no-op, not an error —
      // two teachers adding overlapping selections shouldn't collide.
      .onConflictDoNothing({
        target: [GroupStudentsTable.groupId, GroupStudentsTable.traineeId],
      })
      .returning({ id: GroupStudentsTable.id });

    return { added: inserted.length, requested: input.traineeIds.length };
  });
}

export async function removeGroupStudent(
  ctx: OrgTRPCContext,
  input: GroupRemoveStudentInput,
) {
  const [removed] = await ctx.db
    .delete(GroupStudentsTable)
    .where(
      and(
        eq(GroupStudentsTable.groupId, input.groupId),
        eq(GroupStudentsTable.traineeId, input.traineeId),
        eq(GroupStudentsTable.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: GroupStudentsTable.id });

  if (!removed) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { removed: true };
}
