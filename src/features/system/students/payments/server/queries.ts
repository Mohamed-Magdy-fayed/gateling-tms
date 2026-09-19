import { and, desc, eq, sum } from "drizzle-orm";
import {
  CoursesTable,
  EnrollmentsTable,
  PaymentsTable,
} from "@/drizzle/schema";
import type { ListPaymentsInput } from "./schemas";
import type { OrgTRPCContext } from "./types";

/**
 * One student's payments, newest payment date first, with the running total
 * the profile shows in its header. Unpaginated for the same reason notes
 * are: a student's payment history is a short list.
 *
 * The enrollment/course joins are left joins — `enrollmentId` is optional
 * and is nulled when the enrollment goes (payments-table.ts) — and the
 * course name is read live rather than denormalized: unlike a certificate,
 * a payment row is not something the academy hands to the student, so a
 * renamed course simply reads with its new name.
 */
export async function listPayments(
  ctx: OrgTRPCContext,
  input: ListPaymentsInput,
) {
  const whereClause = and(
    eq(PaymentsTable.organizationId, ctx.organizationId),
    eq(PaymentsTable.traineeId, input.traineeId),
  );

  const [rows, [totals]] = await Promise.all([
    ctx.db
      .select({
        id: PaymentsTable.id,
        amount: PaymentsTable.amount,
        paidAt: PaymentsTable.paidAt,
        method: PaymentsTable.method,
        enrollmentId: PaymentsTable.enrollmentId,
        courseName: CoursesTable.name,
        reference: PaymentsTable.reference,
        note: PaymentsTable.note,
        createdAt: PaymentsTable.createdAt,
        createdBy: PaymentsTable.createdBy,
      })
      .from(PaymentsTable)
      .leftJoin(
        EnrollmentsTable,
        eq(EnrollmentsTable.id, PaymentsTable.enrollmentId),
      )
      .leftJoin(CoursesTable, eq(CoursesTable.id, EnrollmentsTable.courseId))
      .where(whereClause)
      .orderBy(
        desc(PaymentsTable.paidAt),
        desc(PaymentsTable.createdAt),
        desc(PaymentsTable.id),
      ),
    ctx.db
      .select({ total: sum(PaymentsTable.amount) })
      .from(PaymentsTable)
      .where(whereClause),
  ]);

  // `sum()` comes back as a string (or null over no rows) whatever the
  // column's mode is.
  const total = totals?.total ? Number(totals.total) : 0;

  return { rows, total };
}
