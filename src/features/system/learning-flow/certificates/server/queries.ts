import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import {
  CertificatesTable,
  CoursesTable,
  GroupsTable,
  OrganizationsTable,
  TraineesTable,
} from "@/drizzle/schema";
import { likeContains } from "@/drizzle/lib/search";
import type { ListCertificatesInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

function buildWhereClause(ctx: OrgTRPCContext, input: ListCertificatesInput) {
  const search = input.globalFilter?.trim();

  return and(
    eq(CertificatesTable.organizationId, ctx.organizationId),
    input.traineeId
      ? eq(CertificatesTable.traineeId, input.traineeId)
      : undefined,
    search
      ? or(
          ilike(CertificatesTable.title, likeContains(search)),
          ilike(TraineesTable.name, likeContains(search)),
        )
      : undefined,
  );
}

// Every branch appends `id` as a tiebreaker so ties in the primary sort don't
// leave row order (and therefore offset pagination) nondeterministic — same
// pattern as enrollments'/trainees' queries.ts (STATE.md D35).
function sortExpr(input: ListCertificatesInput) {
  const firstSort = input.sorting[0];
  if (!firstSort) {
    return [desc(CertificatesTable.issuedAt), asc(CertificatesTable.id)];
  }

  switch (firstSort.id) {
    case "title":
      return [
        firstSort.desc
          ? desc(CertificatesTable.title)
          : asc(CertificatesTable.title),
        asc(CertificatesTable.id),
      ];
    case "traineeName":
      return [
        firstSort.desc ? desc(TraineesTable.name) : asc(TraineesTable.name),
        asc(CertificatesTable.id),
      ];
    default:
      return [
        firstSort.desc
          ? desc(CertificatesTable.issuedAt)
          : asc(CertificatesTable.issuedAt),
        asc(CertificatesTable.id),
      ];
  }
}

/**
 * The trainee join is inner (composite FK, cascade — a certificate can't
 * outlive its trainee) and deliberately does *not* exclude soft-deleted
 * trainees: a certificate is a historical record, and removing someone from
 * the roster must not make the certificate they earned disappear.
 *
 * Course and group are left joins because both columns are nullable and are
 * nulled outright when the referenced row is deleted (STATE.md D79) — the
 * denormalized `title` is what keeps the certificate readable afterwards.
 */
export async function listCertificates(
  ctx: OrgTRPCContext,
  input: ListCertificatesInput,
) {
  const whereClause = buildWhereClause(ctx, input);

  const [{ value: total }] = await ctx.db
    .select({ value: count() })
    .from(CertificatesTable)
    .innerJoin(TraineesTable, eq(TraineesTable.id, CertificatesTable.traineeId))
    .where(whereClause);

  const pageCount = Math.max(1, Math.ceil(Number(total) / input.perPage));
  const page = Math.min(input.page, pageCount);
  const offset = (page - 1) * input.perPage;

  const rows = await ctx.db
    .select({
      id: CertificatesTable.id,
      traineeId: CertificatesTable.traineeId,
      traineeName: TraineesTable.name,
      title: CertificatesTable.title,
      courseName: CoursesTable.name,
      groupName: GroupsTable.name,
      issuedAt: CertificatesTable.issuedAt,
    })
    .from(CertificatesTable)
    .innerJoin(TraineesTable, eq(TraineesTable.id, CertificatesTable.traineeId))
    .leftJoin(CoursesTable, eq(CoursesTable.id, CertificatesTable.courseId))
    .leftJoin(GroupsTable, eq(GroupsTable.id, CertificatesTable.groupId))
    .where(whereClause)
    .orderBy(...sortExpr(input))
    .limit(input.perPage)
    .offset(offset);

  return { rows, page, pageCount, total: Number(total) };
}

/**
 * Everything the printable certificate renders, resolved server-side so the
 * page has no second round trip: the academy's own name comes from the
 * organization, the rest from the certificate and its (possibly since-deleted)
 * course/group.
 */
export async function getCertificate(ctx: OrgTRPCContext, id: string) {
  const [certificate] = await ctx.db
    .select({
      id: CertificatesTable.id,
      traineeId: CertificatesTable.traineeId,
      traineeName: TraineesTable.name,
      title: CertificatesTable.title,
      courseId: CertificatesTable.courseId,
      courseName: CoursesTable.name,
      groupId: CertificatesTable.groupId,
      groupName: GroupsTable.name,
      issuedAt: CertificatesTable.issuedAt,
      organizationName: OrganizationsTable.name,
      organizationTimeZone: OrganizationsTable.timeZone,
    })
    .from(CertificatesTable)
    .innerJoin(TraineesTable, eq(TraineesTable.id, CertificatesTable.traineeId))
    .innerJoin(
      OrganizationsTable,
      eq(OrganizationsTable.id, CertificatesTable.organizationId),
    )
    .leftJoin(CoursesTable, eq(CoursesTable.id, CertificatesTable.courseId))
    .leftJoin(GroupsTable, eq(GroupsTable.id, CertificatesTable.groupId))
    .where(
      and(
        eq(CertificatesTable.id, id),
        eq(CertificatesTable.organizationId, ctx.organizationId),
      ),
    );

  if (!certificate) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return certificate;
}
