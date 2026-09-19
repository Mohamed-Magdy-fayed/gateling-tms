import {
  createTRPCRouter,
  orgContentManagerProcedure,
} from "@/integrations/trpc/init";
import { setTeacherAvailability } from "./mutations";
import { listTeacherAvailability } from "./queries";
import {
  listTeacherAvailabilityInput,
  setTeacherAvailabilitySchema,
} from "./schemas";

/**
 * Staff-only in both directions. When a teacher is free is scheduling
 * information — a student sees their own classes on the agenda and nothing
 * about who could have taught them instead. The per-row rule (a teacher may
 * only set their *own* windows) lives in `mutations.ts`, next to the write it
 * governs.
 */
export const teacherAvailabilityRouter = createTRPCRouter({
  list: orgContentManagerProcedure
    .input(listTeacherAvailabilityInput)
    .query(async ({ ctx, input }) => listTeacherAvailability(ctx, input)),
  set: orgContentManagerProcedure
    .input(setTeacherAvailabilitySchema)
    .mutation(async ({ ctx, input }) => setTeacherAvailability(ctx, input)),
});
