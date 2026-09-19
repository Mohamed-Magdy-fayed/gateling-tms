import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import {
  CertificatesTable,
  CoursesTable,
  EnrollmentsTable,
  GroupsTable,
  TraineesTable,
} from "@/drizzle/schema";
import type {
  CertificateDeleteInput,
  CertificateMutationInput,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

/**
 * `certificates.courseId`/`groupId` are plain single-column FKs, not the usual
 * composite (organizationId, x) pair — a composite FK's ON DELETE SET NULL
 * would null the NOT NULL organizationId too and throw (STATE.md D79). So
 * nothing in the database stops either column pointing at another
 * organization's row. These checks are the only thing that does.
 */
async function assertCourseInOrg(ctx: OrgTRPCContext, courseId: string) {
  const course = await ctx.db.query.CoursesTable.findFirst({
    where: and(
      eq(CoursesTable.id, courseId),
      eq(CoursesTable.organizationId, ctx.organizationId),
      isNull(CoursesTable.deletedAt),
    ),
    columns: { id: true },
  });

  if (!course) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("enrollments.courseNotFound"),
    });
  }
}

async function assertGroupInOrg(ctx: OrgTRPCContext, groupId: string) {
  const group = await ctx.db.query.GroupsTable.findFirst({
    where: and(
      eq(GroupsTable.id, groupId),
      eq(GroupsTable.organizationId, ctx.organizationId),
    ),
    columns: { id: true },
  });

  if (!group) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("certificates.groupNotFound"),
    });
  }
}

/**
 * Issues a certificate.
 *
 * A certificate naming a course requires that trainee's enrollment in it to be
 * `completed` — phase-05.md step 7 is explicitly "on completion", and without
 * the check the app would happily certify a course the trainee never finished.
 * Staff who need a free-form certificate (an external achievement, a group
 * with no course attached) leave `courseId` unset instead; that path is open.
 *
 * Group membership is deliberately *not* required the same way: the roster is
 * current membership rather than history, so someone removed from a group
 * after finishing it would otherwise become uncertifiable.
 */
export async function issueCertificate(
  ctx: OrgTRPCContext,
  input: CertificateMutationInput,
) {
  const courseId = input.courseId || null;
  const groupId = input.groupId || null;

  const trainee = await ctx.db.query.TraineesTable.findFirst({
    where: and(
      eq(TraineesTable.id, input.traineeId),
      eq(TraineesTable.organizationId, ctx.organizationId),
      isNull(TraineesTable.deletedAt),
    ),
    columns: { id: true },
  });

  if (!trainee) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("enrollments.traineeNotFound"),
    });
  }

  if (courseId) await assertCourseInOrg(ctx, courseId);
  if (groupId) await assertGroupInOrg(ctx, groupId);

  return ctx.db.transaction(async (trx) => {
    if (courseId) {
      // Locked *before* its status is read, so a concurrent status change
      // can't make the "completed" the check saw stale by the time the
      // certificate is written — the read-then-lock inversion of
      // STATE.md D75(3)/D83(2).
      const [enrollment] = await trx
        .select({ status: EnrollmentsTable.status })
        .from(EnrollmentsTable)
        .where(
          and(
            eq(EnrollmentsTable.organizationId, ctx.organizationId),
            eq(EnrollmentsTable.traineeId, input.traineeId),
            eq(EnrollmentsTable.courseId, courseId),
          ),
        )
        .for("update");

      if (!enrollment) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: ctx.t("certificates.notEnrolled"),
        });
      }

      if (enrollment.status !== "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: ctx.t("certificates.courseNotCompleted"),
        });
      }
    }

    const [certificate] = await trx
      .insert(CertificatesTable)
      .values({
        organizationId: ctx.organizationId,
        traineeId: input.traineeId,
        courseId,
        groupId,
        title: input.title,
      })
      .returning({ id: CertificatesTable.id });

    return { id: certificate.id };
  });
}

// Hard delete — `certificates` carries no soft-delete columns. Revoking a
// certificate issued by mistake is the only reason to reach for this; the
// trainee's enrollment history is untouched either way.
export async function deleteCertificate(
  ctx: OrgTRPCContext,
  input: CertificateDeleteInput,
) {
  const [deleted] = await ctx.db
    .delete(CertificatesTable)
    .where(
      and(
        eq(CertificatesTable.id, input.id),
        eq(CertificatesTable.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: CertificatesTable.id });

  if (!deleted) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { deleted: true };
}
