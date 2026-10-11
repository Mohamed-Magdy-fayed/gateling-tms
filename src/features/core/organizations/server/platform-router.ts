import {
  createTRPCRouter,
  platformOwnerProcedure,
} from "@/integrations/trpc/init";
import { setOrganizationPlan } from "./platform-mutations";
import {
  listAllPlatformOrganizations,
  listPlatformOrganizations,
} from "./platform-queries";
import {
  listPlatformOrganizationsInput,
  setOrganizationPlanSchema,
} from "./schemas";

/**
 * The platform owner's tools over every academy on the deployment. These are
 * the only routes that take another organization's id as input, which is why
 * every one of them sits on `platformOwnerProcedure` rather than
 * `orgProcedure`: the tenant here is chosen by the owner, not resolved from
 * the session.
 */
export const platformRouter = createTRPCRouter({
  listOrganizations: platformOwnerProcedure
    .input(listPlatformOrganizationsInput)
    .query(async ({ ctx, input }) => listPlatformOrganizations(ctx, input)),
  // The whole list for the client-mode Academies table.
  listAllOrganizations: platformOwnerProcedure.query(async ({ ctx }) =>
    listAllPlatformOrganizations(ctx),
  ),
  setOrganizationPlan: platformOwnerProcedure
    .input(setOrganizationPlanSchema)
    .mutation(async ({ ctx, input }) => setOrganizationPlan(ctx, input)),
});
