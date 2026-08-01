import { TRPCError } from "@trpc/server";
import { and, eq, inArray, isNull } from "drizzle-orm";
import {
  CoursesTable,
  GroupStudentsTable,
  GroupsTable,
  OrganizationMembershipsTable,
  TraineesTable,
} from "@/drizzle/schema";
import { regenerateGroupSessions } from "./regenerate-sessions";
import type {
  GroupAddStudentsInput,
  GroupDeleteInput,
  GroupMutationInput,
  GroupRemoveStudentInput,
  GroupUpdateInput,
  SessionRegenerationMode,
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
 * Generates the group's sessions before the mutation returns.
 *
 * This deliberately does *not* go through Inngest, and the reason is worth
 * stating because the first attempt at this fix got it wrong. It used to send
 * `group/schedule-changed` and fall back to inline generation only when
 * `inngest.send` **threw** — which does not cover the failure that actually
 * happens in production (D178). When the Inngest app has never synced, the send
 * *succeeds*: events are accepted with the event key and simply have no
 * consumer. The fallback never fired, and the group stayed sessionless — the
 * exact bug this was meant to fix, surviving the fix.
 *
 * Inline is affordable. `regenerateGroupSessions` is one transaction writing at
 * most `MAX_GENERATED_SESSIONS` rows with no external call inside it — the same
 * order of cost as the queue round trip it replaces. Weighed against a group
 * whose schedule silently never materialises, a few milliseconds on save is not
 * a trade worth making: "instant onboarding" means the user gets a working
 * class, not that the save returns before the work is done.
 *
 * The Inngest path still exists for the nightly backfill, which regenerates
 * anything that slipped through. It is the safety net now, not the mechanism.
 */
async function generateSessionsForGroup(
  ctx: OrgTRPCContext,
  groupId: string,
): Promise<SessionRegenerationMode> {
  try {
    await regenerateGroupSessions({
      db: ctx.db,
      organizationId: ctx.organizationId,
      groupId,
    });
    return "generated";
  } catch (error) {
    // The group itself was written and is still useful, so this stays a
    // warning the client surfaces rather than an error that hides what did
    // succeed — and `groups.regenerateSessions` is the retry.
    console.error("Failed to generate group sessions", {
      groupId,
      organizationId: ctx.organizationId,
      error,
    });
    return "failed";
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
      courseId: input.courseId || null,
      teacherId: input.teacherId || null,
      status: input.status,
      startDate: input.startDate,
      sessionCount: input.sessionCount,
      schedule: input.schedule,
    })
    .returning({ id: GroupsTable.id });

  const sessions = await generateSessionsForGroup(ctx, group.id);

  return { id: group.id, sessions };
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
      courseId: input.courseId || null,
      teacherId: input.teacherId || null,
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
  const sessions = await generateSessionsForGroup(ctx, input.id);

  return { updated: true, sessions };
}

/**
 * Rebuilds a group's sessions on demand.
 *
 * The escape hatch for a group whose generation never landed — before this,
 * the only way to retry was to open the group and re-save it unchanged, which
 * nobody would guess. Runs the generation directly rather than re-queueing it:
 * someone pressing this button has already been failed by the queue once, and
 * is waiting for an answer.
 */
export async function regenerateGroupSessionsForOrg(
  ctx: OrgTRPCContext,
  input: GroupDeleteInput,
) {
  const group = await ctx.db.query.GroupsTable.findFirst({
    where: and(
      eq(GroupsTable.id, input.id),
      eq(GroupsTable.organizationId, ctx.organizationId),
    ),
    columns: { id: true },
  });

  if (!group) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return regenerateGroupSessions({
    db: ctx.db,
    organizationId: ctx.organizationId,
    groupId: input.id,
  });
}

// Hard delete — unlike courses/trainees, `groups` carries no soft-delete
// columns. Roster rows and generated sessions go with it via ON DELETE
// CASCADE; a trainee's own record and their enrollments are untouched.
export async function deleteGroup(
  ctx: OrgTRPCContext,
  input: GroupDeleteInput,
) {
  // The group's sessions go with it (composite FK, ON DELETE CASCADE).
  // Nothing has to be told about that: onMeeting meetings are created when a
  // class is started and live in the room until it ends, and there is no
  // delete-meeting endpoint to call anyway (STATE.md D143/D145).
  await ctx.db.transaction(async (trx) => {
    const [deleted] = await trx
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
  });

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
