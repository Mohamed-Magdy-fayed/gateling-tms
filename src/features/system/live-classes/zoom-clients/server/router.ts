import {
  createTRPCRouter,
  orgAdminProcedure,
  orgProcedure,
} from "@/integrations/trpc/init";
import { isZoomConfigured } from "./config";
import {
  createZoomClient,
  disconnectZoomClient,
  updateZoomClient,
} from "./mutations";
import { getZoomClient, listZoomClients } from "./queries";
import {
  listZoomClientsInput,
  zoomClientIdSchema,
  zoomClientMutationSchema,
  zoomClientUpdateSchema,
} from "./schemas";

export const zoomClientsRouter = createTRPCRouter({
  // Readable by any member: a teacher needs to know whether the org has a
  // Zoom account at all. No token column is selected (see queries.ts).
  list: orgProcedure
    .input(listZoomClientsInput)
    .query(async ({ ctx, input }) => listZoomClients(ctx, input)),
  get: orgProcedure
    .input(zoomClientIdSchema)
    .query(async ({ ctx, input }) => getZoomClient(ctx, input.id)),
  // Whether the deployment has Zoom credentials at all — lets the page
  // explain "ask the operator to configure Zoom" instead of offering a
  // Connect button that can only fail.
  isConfigured: orgProcedure.query(() => ({ configured: isZoomConfigured() })),
  // Connecting a Zoom account binds an external billing-bearing account to
  // the org, so it is admin-only rather than admin-or-teacher.
  create: orgAdminProcedure
    .input(zoomClientMutationSchema)
    .mutation(async ({ ctx, input }) => createZoomClient(ctx, input)),
  update: orgAdminProcedure
    .input(zoomClientUpdateSchema)
    .mutation(async ({ ctx, input }) => updateZoomClient(ctx, input)),
  disconnect: orgAdminProcedure
    .input(zoomClientIdSchema)
    .mutation(async ({ ctx, input }) => disconnectZoomClient(ctx, input)),
});
