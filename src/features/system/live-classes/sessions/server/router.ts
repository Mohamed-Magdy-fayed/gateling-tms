import { createTRPCRouter, orgProcedure } from "@/integrations/trpc/init";
import { listGroupSessions, listSessions } from "./queries";
import { listSessionsInput, sessionsByGroupSchema } from "./schemas";

/**
 * Readable by every member, students included: knowing when your class is and
 * how to join it is the whole point of the agenda.
 *
 * Two things are scoped rather than shared, both inside `queries.ts` because
 * they vary per row: a `student` sees only the classes their own trainee
 * record is on, and the host `start_url` goes only to the session's assigned
 * teacher and to admins.
 */
export const sessionsRouter = createTRPCRouter({
  list: orgProcedure
    .input(listSessionsInput)
    .query(async ({ ctx, input }) => listSessions(ctx, input)),
  byGroup: orgProcedure
    .input(sessionsByGroupSchema)
    .query(async ({ ctx, input }) => listGroupSessions(ctx, input.groupId)),
});
