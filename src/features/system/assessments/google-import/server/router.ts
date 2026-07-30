import {
  createTRPCRouter,
  orgAdminProcedure,
  orgContentManagerProcedure,
} from "@/integrations/trpc/init";
import { isGoogleImportConfigured } from "./config";
import { importGoogleForm, previewGoogleForm } from "./import";
import { disconnectGoogleIntegration } from "./mutations";
import { getGoogleIntegration } from "./queries";
import { googleFormImportSchema, googleFormPreviewSchema } from "./schemas";

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
  // A mutation rather than a query even though it writes nothing: it is a
  // deliberate action against a rate-limited third party, not something to
  // re-run on every window focus the way a query would be.
  preview: orgContentManagerProcedure
    .input(googleFormPreviewSchema)
    .mutation(async ({ ctx, input }) => previewGoogleForm(ctx, input)),
  import: orgContentManagerProcedure
    .input(googleFormImportSchema)
    .mutation(async ({ ctx, input }) => importGoogleForm(ctx, input)),
});
