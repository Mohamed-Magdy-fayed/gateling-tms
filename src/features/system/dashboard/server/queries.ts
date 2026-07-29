import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, gte, lt, ne } from "drizzle-orm";
import {
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
 * `studentCount`/`courseCount` are read off the organization row rather than
 * counted here — they are the same maintained counters the plan limits are
 * enforced against (`assertCanAddStudent`), so counting separately could show
 * a number the limit check disagrees with. Groups have no counter and no
 * limit, so they are counted directly.
 */
export async function getDashboardOverview(ctx: OrgTRPCContext) {
  const organization = await ctx.db.query.OrganizationsTable.findFirst({
    where: eq(OrganizationsTable.id, ctx.organizationId),
    columns: {
      plan: true,
      studentCount: true,
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

  // Both need the organization row (the day bounds are on its clock), but not
  // each other — so they go out together.
  const [[{ value: groupCount }], todaysSessions] = await Promise.all([
    ctx.db
      .select({ value: count() })
      .from(GroupsTable)
      .where(eq(GroupsTable.organizationId, ctx.organizationId)),
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
          eq(SessionsTable.organizationId, ctx.organizationId),
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

  return {
    plan: organization.plan,
    timeZone: organization.timeZone,
    counts: {
      students: organization.studentCount,
      courses: organization.courseCount,
      groups: Number(groupCount),
    },
    limits: {
      students: limits.maxStudents,
      courses: limits.maxCourses,
    },
    todaysSessions,
  };
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
      .where(eq(EnrollmentsTable.organizationId, ctx.organizationId))
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
      .where(eq(CertificatesTable.organizationId, ctx.organizationId))
      .orderBy(desc(CertificatesTable.issuedAt), desc(CertificatesTable.id))
      .limit(RECENT_ACTIVITY_LIMIT),
  ]);

  return { enrollments, certificates };
}
