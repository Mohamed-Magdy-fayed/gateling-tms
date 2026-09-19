import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import {
  EnrollmentsTable,
  PaymentsTable,
  TraineesTable,
} from "@/drizzle/schema";
import type {
  PaymentDeleteInput,
  PaymentMutationInput,
  PaymentUpdateInput,
} from "./schemas";
import type { OrgTRPCContext } from "./types";

function actorLabel(ctx: OrgTRPCContext): string {
  const session = ctx.session;
  if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });
  return session.user.email ?? session.user.id;
}

async function assertTraineeInOrg(ctx: OrgTRPCContext, traineeId: string) {
  const trainee = await ctx.db.query.TraineesTable.findFirst({
    where: and(
      eq(TraineesTable.id, traineeId),
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
}

/**
 * `payments.enrollmentId` is a plain single-column FK (payments-table.ts), so
 * the database alone would let it point at another organization's enrollment
 * — or at this organization's enrollment of a *different* student. Both are
 * refused here.
 */
async function assertEnrollmentBelongsTo(
  ctx: OrgTRPCContext,
  enrollmentId: string,
  traineeId: string,
) {
  const enrollment = await ctx.db.query.EnrollmentsTable.findFirst({
    where: and(
      eq(EnrollmentsTable.id, enrollmentId),
      eq(EnrollmentsTable.organizationId, ctx.organizationId),
      eq(EnrollmentsTable.traineeId, traineeId),
    ),
    columns: { id: true },
  });

  if (!enrollment) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("payments.enrollmentNotFound"),
    });
  }
}

function normalize(input: PaymentMutationInput) {
  return {
    amount: input.amount,
    paidAt: input.paidAt,
    method: input.method,
    enrollmentId: input.enrollmentId || null,
    reference: input.reference || null,
    note: input.note || null,
  };
}

export async function createPayment(
  ctx: OrgTRPCContext,
  input: PaymentMutationInput,
) {
  await assertTraineeInOrg(ctx, input.traineeId);
  const values = normalize(input);
  if (values.enrollmentId) {
    await assertEnrollmentBelongsTo(ctx, values.enrollmentId, input.traineeId);
  }

  const [payment] = await ctx.db
    .insert(PaymentsTable)
    .values({
      organizationId: ctx.organizationId,
      traineeId: input.traineeId,
      ...values,
      createdBy: actorLabel(ctx),
    })
    .returning({ id: PaymentsTable.id });

  return { id: payment.id };
}

/**
 * The payment's trainee is fixed at creation: a payment recorded against
 * the wrong student is deleted and re-recorded, not moved, so the update's
 * `traineeId` only scopes the row and checks the enrollment being attached.
 */
export async function updatePayment(
  ctx: OrgTRPCContext,
  input: PaymentUpdateInput,
) {
  const values = normalize(input);
  if (values.enrollmentId) {
    await assertEnrollmentBelongsTo(ctx, values.enrollmentId, input.traineeId);
  }

  const [updated] = await ctx.db
    .update(PaymentsTable)
    .set({ ...values, updatedBy: actorLabel(ctx) })
    .where(
      and(
        eq(PaymentsTable.id, input.id),
        eq(PaymentsTable.organizationId, ctx.organizationId),
        eq(PaymentsTable.traineeId, input.traineeId),
      ),
    )
    .returning({ id: PaymentsTable.id });

  if (!updated) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { updated: true };
}

// Hard delete: the row is a bookkeeping entry with nothing hanging off it,
// and the only reason to remove one is that it was recorded by mistake.
export async function deletePayment(
  ctx: OrgTRPCContext,
  input: PaymentDeleteInput,
) {
  const [deleted] = await ctx.db
    .delete(PaymentsTable)
    .where(
      and(
        eq(PaymentsTable.id, input.id),
        eq(PaymentsTable.organizationId, ctx.organizationId),
      ),
    )
    .returning({ id: PaymentsTable.id });

  if (!deleted) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: ctx.t("errors.notFound"),
    });
  }

  return { deleted: true };
}
