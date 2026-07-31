import {
  createTRPCRouter,
  orgAdminProcedure,
  orgProcedure,
} from "@/integrations/trpc/init";
import { isOnMeetingConfigured } from "./config";
import {
  connectMeetingAccount,
  disconnectMeetingAccount,
  renameMeetingAccount,
} from "./mutations";
import { getMeetingAccount, listMeetingAccounts } from "./queries";
import {
  connectMeetingAccountSchema,
  listMeetingAccountsInput,
  meetingAccountIdSchema,
  renameMeetingAccountSchema,
} from "./schemas";

export const meetingAccountsRouter = createTRPCRouter({
  // Readable by any member: a teacher needs to know whether the org has a room
  // at all. No credential column is selected (see queries.ts).
  list: orgProcedure
    .input(listMeetingAccountsInput)
    .query(async ({ ctx, input }) => listMeetingAccounts(ctx, input)),
  get: orgProcedure
    .input(meetingAccountIdSchema)
    .query(async ({ ctx, input }) => getMeetingAccount(ctx, input.id)),
  // Whether the deployment can encrypt credentials at all — lets the page
  // explain "ask the operator to configure onMeeting" instead of offering a
  // form that asks for a password and can only fail.
  isConfigured: orgProcedure.query(() => ({
    configured: isOnMeetingConfigured(),
  })),
  // Connecting binds an external, billed onMeeting account to the org and
  // accepts that account's password, so it is admin-only.
  connect: orgAdminProcedure
    .input(connectMeetingAccountSchema)
    .mutation(async ({ ctx, input }) => connectMeetingAccount(ctx, input)),
  rename: orgAdminProcedure
    .input(renameMeetingAccountSchema)
    .mutation(async ({ ctx, input }) => renameMeetingAccount(ctx, input)),
  disconnect: orgAdminProcedure
    .input(meetingAccountIdSchema)
    .mutation(async ({ ctx, input }) => disconnectMeetingAccount(ctx, input)),
});
