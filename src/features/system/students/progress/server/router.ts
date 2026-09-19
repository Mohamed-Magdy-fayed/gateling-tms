import {
  createTRPCRouter,
  orgContentManagerProcedure,
} from "@/integrations/trpc/init";
import { getGroupProgress, getTraineeProgress } from "./queries";
import { groupProgressInput, traineeProgressInput } from "./schemas";

/**
 * Admin/teacher-only: `group` returns every roster member's name alongside how
 * far they have got, which is exactly the cross-trainee visibility D83(1) shut
 * off for `groups.students`. `trainee` is gated the same way for consistency
 * with `enrollments.get` (D86), which is where all of its underlying figures
 * come from anyway.
 */
export const progressRouter = createTRPCRouter({
  trainee: orgContentManagerProcedure
    .input(traineeProgressInput)
    .query(async ({ ctx, input }) => getTraineeProgress(ctx, input.traineeId)),
  group: orgContentManagerProcedure
    .input(groupProgressInput)
    .query(async ({ ctx, input }) => getGroupProgress(ctx, input.groupId)),
});
