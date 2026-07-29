import {
  createTRPCRouter,
  orgContentManagerProcedure,
} from "@/integrations/trpc/init";
import { markAttendance } from "./mutations";
import { getSessionAttendance } from "./queries";
import { markAttendanceSchema, sessionAttendanceSchema } from "./schemas";

/**
 * Staff-only, both routes.
 *
 * A register names every trainee on the roster and says who missed the class —
 * the same order of information as the trainee list, which students were
 * locked out of in PR #30. Reading is admin-or-teacher; *changing* it is
 * narrower still and checked per session inside the mutation, since it belongs
 * to the teacher actually running that class.
 */
export const attendanceRouter = createTRPCRouter({
  bySession: orgContentManagerProcedure
    .input(sessionAttendanceSchema)
    .query(async ({ ctx, input }) =>
      getSessionAttendance(ctx, input.sessionId),
    ),
  mark: orgContentManagerProcedure
    .input(markAttendanceSchema)
    .mutation(async ({ ctx, input }) => markAttendance(ctx, input)),
});
