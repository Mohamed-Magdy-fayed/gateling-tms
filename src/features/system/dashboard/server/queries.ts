import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  count,
  countDistinct,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  ne,
} from "drizzle-orm";
import {
  BranchesTable,
  CertificatesTable,
  CoursesTable,
  EnrollmentsTable,
  GroupsTable,
  OrganizationsTable,
  SessionsTable,
  TraineesTable,
  UsersTable,
} from "@/drizzle/schema";
import { PLAN_LIMITS } from "@/features/core/organizations/server";
import { getDayBoundsInZone } from "./day-bounds";
import type { OrgTRPCContext } from "./types";

/** How many rows each recent-activity strip shows. */
const RECENT_ACTIVITY_LIMIT = 5;

/**
 * Everything the dashboard renders (phase-05.md step 8), in one round trip.
 *
 * The tiles follow the branch switcher (docs/designs/academy-branches.md):
 * students and groups are counted inside the selected branches. Courses are
 * shared academy content, so on the whole academy the tile is the library
 * count (the counter the plan limit is enforced against); narrowed to some
 * branches it is the courses those branches teach — the ones with a group
 * there. Plan limits are academy-wide, so they're only offered when the tiles
 * cover the whole academy.
 */
export async function getDashboardOverview(ctx: OrgTRPCContext) {
  const organization = await ctx.db.query.OrganizationsTable.findFirst({
    where: eq(OrganizationsTable.id, ctx.organizationId),
    columns: {
      plan: true,
      courseCount: true,
      timeZone: true,
    },
  });

  if (!organization) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.noActiveOrganization"),
    });
  }

  const { start, end } = getDayBoundsInZone(new Date(), organization.timeZone);
  // A single branch picked out of several. A member who can only ever see
  // one branch is looking at everything they have, so that's not narrowed.
  const isNarrowed = ctx.branchIds.length < ctx.visibleBranchIds.length;

  // All need the organization row (the day bounds are on its clock), but not
  // each other — so they go out together.
  const [
    [{ value: studentCount }],
    taughtCourseCount,
    [{ value: groupCount }],
    todaysSessions,
  ] = await Promise.all([
    ctx.db
      .select({ value: count() })
      .from(TraineesTable)
      .where(
        and(
          eq(TraineesTable.organizationId, ctx.organizationId),
          inArray(TraineesTable.branchId, ctx.branchIds),
          isNull(TraineesTable.deletedAt),
        ),
      ),
    isNarrowed ? countTaughtCourses(ctx) : null,
    ctx.db
      .select({ value: count() })
      .from(GroupsTable)
      .where(
        and(
          eq(GroupsTable.organizationId, ctx.organizationId),
          inArray(GroupsTable.branchId, ctx.branchIds),
        ),
      ),
    ctx.db
      .select({
        id: SessionsTable.id,
        groupId: SessionsTable.groupId,
        groupName: GroupsTable.name,
        scheduledAt: SessionsTable.scheduledAt,
        durationMinutes: SessionsTable.durationMinutes,
        status: SessionsTable.status,
        teacherName: UsersTable.name,
      })
      .from(SessionsTable)
      .innerJoin(GroupsTable, eq(GroupsTable.id, SessionsTable.groupId))
      .leftJoin(UsersTable, eq(UsersTable.id, SessionsTable.teacherId))
      .where(
        and(
          and(
            eq(SessionsTable.organizationId, ctx.organizationId),
            inArray(SessionsTable.branchId, ctx.branchIds),
          ),
          gte(SessionsTable.scheduledAt, start),
          lt(SessionsTable.scheduledAt, end),
          // A called-off class isn't part of today's plan, but it stays
          // visible on the group's own page as history.
          ne(SessionsTable.status, "cancelled"),
        ),
      )
      .orderBy(SessionsTable.scheduledAt),
  ]);

  const limits = PLAN_LIMITS[organization.plan];
  const branches =
    ctx.activeBranchId === null && ctx.branchIds.length > 1
      ? await getBranchBreakdown(ctx, start, end)
      : null;

  return {
    plan: organization.plan,
    timeZone: organization.timeZone,
    isNarrowed,
    counts: {
      students: Number(studentCount),
      courses: taughtCourseCount ?? organization.courseCount,
      groups: Number(groupCount),
    },
    limits: isNarrowed
      ? null
      : { students: limits.maxStudents, courses: limits.maxCourses },
    todaysSessions,
    branches,
  };
}

/** Live courses with at least one group in the selected branches. */
async function countTaughtCourses(ctx: OrgTRPCContext): Promise<number> {
  const [{ value }] = await ctx.db
    .select({ value: countDistinct(GroupsTable.courseId) })
    .from(GroupsTable)
    .innerJoin(CoursesTable, eq(CoursesTable.id, GroupsTable.courseId))
    .where(
      and(
        eq(GroupsTable.organizationId, ctx.organizationId),
        inArray(GroupsTable.branchId, ctx.branchIds),
        isNull(CoursesTable.deletedAt),
      ),
    );
  return Number(value);
}

export type BranchBreakdownRow = {
  id: string;
  name: string;
  students: number;
  groups: number;
  todaysClasses: number;
};

/**
 * Per-branch counts for "All branches" (docs/designs/academy-branches.md):
 * the headline tiles add the branches up, this shows how they split.
 */
async function getBranchBreakdown(
  ctx: OrgTRPCContext,
  start: Date,
  end: Date,
): Promise<BranchBreakdownRow[]> {
  const [branches, students, groups, classes] = await Promise.all([
    ctx.db
      .select({ id: BranchesTable.id, name: BranchesTable.name })
      .from(BranchesTable)
      .where(
        and(
          eq(BranchesTable.organizationId, ctx.organizationId),
          inArray(BranchesTable.id, ctx.branchIds),
        ),
      )
      .orderBy(asc(BranchesTable.createdAt), asc(BranchesTable.name)),
    ctx.db
      .select({ branchId: TraineesTable.branchId, value: count() })
      .from(TraineesTable)
      .where(
        and(
          eq(TraineesTable.organizationId, ctx.organizationId),
          inArray(TraineesTable.branchId, ctx.branchIds),
          isNull(TraineesTable.deletedAt),
        ),
      )
      .groupBy(TraineesTable.branchId),
    ctx.db
      .select({ branchId: GroupsTable.branchId, value: count() })
      .from(GroupsTable)
      .where(
        and(
          eq(GroupsTable.organizationId, ctx.organizationId),
          inArray(GroupsTable.branchId, ctx.branchIds),
        ),
      )
      .groupBy(GroupsTable.branchId),
    ctx.db
      .select({ branchId: SessionsTable.branchId, value: count() })
      .from(SessionsTable)
      .where(
        and(
          eq(SessionsTable.organizationId, ctx.organizationId),
          inArray(SessionsTable.branchId, ctx.branchIds),
          gte(SessionsTable.scheduledAt, start),
          lt(SessionsTable.scheduledAt, end),
          ne(SessionsTable.status, "cancelled"),
        ),
      )
      .groupBy(SessionsTable.branchId),
  ]);

  const countOf = (rows: { branchId: string; value: number }[], id: string) =>
    Number(rows.find((row) => row.branchId === id)?.value ?? 0);

  return branches.map((branch) => ({
    ...branch,
    students: countOf(students, branch.id),
    groups: countOf(groups, branch.id),
    todaysClasses: countOf(classes, branch.id),
  }));
}

/**
 * Recent activity, split out from the overview because it names trainees.
 *
 * Gated at the router as content-manager-only for that reason — the same call
 * D75(1)/D83(1)/D86 made. The dashboard itself stays readable by any member;
 * a student simply gets the counts and today's schedule.
 */
export async function getRecentActivity(ctx: OrgTRPCContext) {
  // Neither strip depends on the other, so one round trip instead of two.
  const [enrollments, certificates] = await Promise.all([
    ctx.db
      .select({
        id: EnrollmentsTable.id,
        traineeId: EnrollmentsTable.traineeId,
        traineeName: TraineesTable.name,
        courseName: CoursesTable.name,
        status: EnrollmentsTable.status,
        at: EnrollmentsTable.createdAt,
      })
      .from(EnrollmentsTable)
      .innerJoin(
        TraineesTable,
        eq(TraineesTable.id, EnrollmentsTable.traineeId),
      )
      .innerJoin(CoursesTable, eq(CoursesTable.id, EnrollmentsTable.courseId))
      .where(
        and(
          eq(EnrollmentsTable.organizationId, ctx.organizationId),
          inArray(EnrollmentsTable.branchId, ctx.branchIds),
        ),
      )
      .orderBy(desc(EnrollmentsTable.createdAt), desc(EnrollmentsTable.id))
      .limit(RECENT_ACTIVITY_LIMIT),
    ctx.db
      .select({
        id: CertificatesTable.id,
        traineeId: CertificatesTable.traineeId,
        traineeName: TraineesTable.name,
        title: CertificatesTable.title,
        at: CertificatesTable.issuedAt,
      })
      .from(CertificatesTable)
      .innerJoin(
        TraineesTable,
        eq(TraineesTable.id, CertificatesTable.traineeId),
      )
      .where(
        and(
          eq(CertificatesTable.organizationId, ctx.organizationId),
          inArray(CertificatesTable.branchId, ctx.branchIds),
        ),
      )
      .orderBy(desc(CertificatesTable.issuedAt), desc(CertificatesTable.id))
      .limit(RECENT_ACTIVITY_LIMIT),
  ]);

  return { enrollments, certificates };
}
