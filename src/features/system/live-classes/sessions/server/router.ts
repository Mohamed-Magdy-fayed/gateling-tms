import { createTRPCRouter, orgProcedure } from "@/integrations/trpc/init";
import { createSessionJoinLink, startSessionMeeting } from "./meetings";
import { listGroupSessions, listSessions } from "./queries";
import {
  listSessionsInput,
  sessionIdSchema,
  sessionsByGroupSchema,
} from "./schemas";

/**
 * Readable by every member, students included: knowing when your class is and
 * how to join it is the whole point of the agenda.
 *
 * Two things are scoped rather than shared, both inside `queries.ts` because
 * they vary per row: a `student` sees only the classes their own trainee
 * record is on, and `isHost` is true for exactly the member whose account
 * holds the room's controls.
 */
export const sessionsRouter = createTRPCRouter({
  list: orgProcedure
    .input(listSessionsInput)
    .query(async ({ ctx, input }) => listSessions(ctx, input)),
  byGroup: orgProcedure
    .input(sessionsByGroupSchema)
    .query(async ({ ctx, input }) => listGroupSessions(ctx, input.groupId)),
  /**
   * Creates the Gateling Meetings room for a session, on demand (STATE.md
   * D143).
   *
   * Left on `orgProcedure` rather than a staff-only procedure because the host
   * rule is per row, not per role: the assigned teacher may start their own
   * class, and `startSessionMeeting` enforces exactly that — a role gate here
   * would either lock out that teacher or let every teacher start every class.
   */
  startMeeting: orgProcedure
    .input(sessionIdSchema)
    .mutation(async ({ ctx, input }) => startSessionMeeting(ctx, input.id)),
  /**
   * Mints this member's signed link into the room — one per click, never
   * stored. The browser reaches it through the
   * `/live-classes/sessions/[id]/join` route, which invokes this procedure via
   * the server-side caller and redirects, so a plain `<a>` is all the UI
   * needs and every rule (membership, student visibility, who is host) is
   * applied exactly once, here.
   */
  joinLink: orgProcedure
    .input(sessionIdSchema)
    .mutation(async ({ ctx, input }) => createSessionJoinLink(ctx, input.id)),
});
