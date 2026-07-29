import { createTRPCRouter, orgProcedure } from "@/integrations/trpc/init";
import { listGroupSessions, listSessions } from "./queries";
import { listSessionsInput, sessionsByGroupSchema } from "./schemas";

/**
 * Readable by every member, students included: knowing when your class is and
 * how to join it is the whole point of the agenda. The host `start_url` is the
 * one thing not everyone gets — `queries.ts` hands it out per row, only to the
 * assigned teacher and to admins.
 */
export const sessionsRouter = createTRPCRouter({
  list: orgProcedure
    .input(listSessionsInput)
    .query(async ({ ctx, input }) => listSessions(ctx, input)),
  byGroup: orgProcedure
    .input(sessionsByGroupSchema)
    .query(async ({ ctx, input }) => listGroupSessions(ctx, input.groupId)),
});
