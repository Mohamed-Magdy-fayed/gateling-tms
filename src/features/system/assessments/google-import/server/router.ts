import {
  createTRPCRouter,
  orgAdminProcedure,
  orgContentManagerProcedure,
} from "@/integrations/trpc/init";
import { isGoogleImportConfigured } from "./config";
import { disconnectGoogleIntegration } from "./mutations";
import { getGoogleIntegration } from "./queries";

export const googleImportRouter = createTRPCRouter({
  // Readable by whoever can author assessments, since the import belongs to
  // that job — but not by a student, since the connected account's email is
  // an admin's business. No token column is selected (see queries.ts).
  get: orgContentManagerProcedure.query(async ({ ctx }) =>
    getGoogleIntegration(ctx),
  ),
  // Whether the deployment has Google credentials at all — lets the page
  // explain "ask the operator to configure Google" instead of offering a
  // Connect button that can only fail.
  isConfigured: orgContentManagerProcedure.query(() => ({
    configured: isGoogleImportConfigured(),
  })),
  // Connecting binds an external account to the whole org, so it is
  // admin-only rather than admin-or-teacher. (Connecting itself happens over
  // the /api/google/* routes — a tRPC mutation can't set the state cookie on
  // the redirect to Google.)
  disconnect: orgAdminProcedure.mutation(async ({ ctx }) =>
    disconnectGoogleIntegration(ctx),
  ),
});
