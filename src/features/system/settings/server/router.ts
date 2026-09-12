import { createTRPCRouter, orgAdminProcedure } from "@/integrations/trpc/init";
import { updateSystemSetting } from "./mutations";
import { listSystemSettings } from "./queries";
import { updateSystemSettingSchema } from "./schemas";

/**
 * Deployment-wide settings, managed by organization admins — the same people
 * who own everything else configurable in the product. There is no separate
 * operator role (STATE.md D42), and these values are what make live classes
 * work for every academy on the deployment, so the admin who sets them up is
 * doing it for all of them.
 */
export const settingsRouter = createTRPCRouter({
  list: orgAdminProcedure.query(async ({ ctx }) => listSystemSettings(ctx)),
  update: orgAdminProcedure
    .input(updateSystemSettingSchema)
    .mutation(async ({ ctx, input }) => updateSystemSetting(ctx, input)),
});
