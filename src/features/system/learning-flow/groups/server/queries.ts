import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, ilike, isNull } from "drizzle-orm";
import { likeContains } from "@/drizzle/lib/search";
import {
  CoursesTable,
  GroupStudentsTable,
  GroupsTable,
  TraineesTable,
  UsersTable,
} from "@/drizzle/schema";
import type { ListGroupsInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

function buildWhereClause(ctx: OrgTRPCContext, input: ListGroupsInput) {
  const search = input.globalFilter?.trim();

  return and(
    eq(GroupsTable.organizationId, ctx.organizationId),
    search ? ilike(GroupsTable.name, likeContains(search)) : undefined,
  );
}

// Every branch appends `id` as a tiebreaker so ties in the primary sort don't
// leave row order (and therefore offset pagination) nondeterministic — same
// pattern as trainees'/courses' queries.ts (STATE.md D35).
function sortExpr(input: ListGroupsInput) {
  const firstSort = input.sorting[0];
  if (!firstSort) return [asc(GroupsTable.name), asc(GroupsTable.id)];

  switch (firstSort.id) {
    case "createdAt":
      return [
        firstSort.desc
          ? desc(GroupsTable.createdAt)
          : asc(GroupsTable.createdAt),
        asc(GroupsTable.id),
      ];
    case "startDate":
      return [
        firstSort.desc
          ? desc(GroupsTable.startDate)
          : asc(GroupsTable.startDate),
        asc(GroupsTable.id),
      ];
    default:
      return [
        firstSort.desc ? desc(GroupsTable.name) : asc(GroupsTable.name),
        asc(GroupsTable.id),
      ];
  }
}

export async function listGroups(ctx: OrgTRPCContext, input: ListGroupsInput) {
  const whereClause = buildWhereClause(ctx, input);

  const [{ value: total }] = await ctx.db
    .select({ value: count() })
    .from(GroupsTable)
    .where(whereClause);

  const pageCount = Math.max(1, Math.ceil(Number(total) / input.perPage));
  const page = Math.min(input.page, pageCount);
  const offset = (page - 1) * input.perPage;

  // Left joins rather than a relational query: the list only needs two
  // display names, and this keeps it a single round trip.
  const rows = await ctx.db
    .select({
      id: GroupsTable.id,
      name: GroupsTable.name,
      courseId: GroupsTable.courseId,
      courseName: CoursesTable.name,
      teacherId: GroupsTable.teacherId,
      teacherName: UsersTable.name,
      schedule: GroupsTable.schedule,
      startDate: GroupsTable.startDate,
      sessionCount: GroupsTable.sessionCount,
      status: GroupsTable.status,
      createdAt: GroupsTable.createdAt,
    })
    .from(GroupsTable)
    .leftJoin(CoursesTable, eq(CoursesTable.id, GroupsTable.courseId))
    .leftJoin(UsersTable, eq(UsersTable.id, GroupsTable.teacherId))
    .where(whereClause)
    .orderBy(...sortExpr(input))
    .limit(input.perPage)
    .offset(offset);

  return { rows, page, pageCount, total: Number(total) };
}

export async function getGroup(ctx: OrgTRPCContext, id: string) {
  const [group] = await ctx.db
    .select({
      id: GroupsTable.id,
      name: GroupsTable.name,
      courseId: GroupsTable.courseId,
      courseName: CoursesTable.name,
      teacherId: GroupsTable.teacherId,
      teacherName: UsersTable.name,
      schedule: GroupsTable.schedule,
      startDate: GroupsTable.startDate,
      sessionCount: GroupsTable.sessionCount,
      status: GroupsTable.status,
      createdAt: GroupsTable.createdAt,
    })
    .from(GroupsTable)
    .leftJoin(CoursesTable, eq(CoursesTable.id, GroupsTable.courseId))
    .leftJoin(UsersTable, eq(UsersTable.id, GroupsTable.teacherId))
    .where(
      and(
        eq(GroupsTable.id, id),
        eq(GroupsTable.organizationId, ctx.organizationId),
      ),
    );

  if (!group) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return group;
}

/**
 * Roster for one group. Soft-deleted trainees are excluded — removing someone
 * from the roster shouldn't require also unpicking every group they were in.
 */
export async function listGroupStudents(ctx: OrgTRPCContext, groupId: string) {
  return ctx.db
    .select({
      traineeId: TraineesTable.id,
      name: TraineesTable.name,
      email: TraineesTable.email,
      phone: TraineesTable.phone,
      addedAt: GroupStudentsTable.createdAt,
    })
    .from(GroupStudentsTable)
    .innerJoin(
      TraineesTable,
      and(
        eq(TraineesTable.id, GroupStudentsTable.traineeId),
        isNull(TraineesTable.deletedAt),
      ),
    )
    .where(
      and(
        eq(GroupStudentsTable.groupId, groupId),
        eq(GroupStudentsTable.organizationId, ctx.organizationId),
      ),
    )
    .orderBy(asc(TraineesTable.name), asc(TraineesTable.id));
}
