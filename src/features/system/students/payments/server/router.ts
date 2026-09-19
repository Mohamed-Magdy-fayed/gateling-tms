import {
  createTRPCRouter,
  orgAdminProcedure,
  orgContentManagerProcedure,
} from "@/integrations/trpc/init";
import { createPayment, deletePayment, updatePayment } from "./mutations";
import { listPayments } from "./queries";
import {
  listPaymentsInput,
  paymentDeleteSchema,
  paymentMutationSchema,
  paymentUpdateSchema,
} from "./schemas";

/**
 * Reads and writes are admin-or-teacher: a teacher who collects a fee in
 * class records it on the spot, and a `student` membership must not see the
 * roster's money at all (the same line `trainees.get` draws).
 *
 * Removing a payment is admin-only. Correcting a typo is an edit; making a
 * received amount disappear from the books is the one thing here that
 * should need the academy's owner.
 */
export const paymentsRouter = createTRPCRouter({
  list: orgContentManagerProcedure
    .input(listPaymentsInput)
    .query(async ({ ctx, input }) => listPayments(ctx, input)),
  create: orgContentManagerProcedure
    .input(paymentMutationSchema)
    .mutation(async ({ ctx, input }) => createPayment(ctx, input)),
  update: orgContentManagerProcedure
    .input(paymentUpdateSchema)
    .mutation(async ({ ctx, input }) => updatePayment(ctx, input)),
  delete: orgAdminProcedure
    .input(paymentDeleteSchema)
    .mutation(async ({ ctx, input }) => deletePayment(ctx, input)),
});
