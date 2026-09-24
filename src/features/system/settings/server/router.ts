import {
  createTRPCRouter,
  orgAdminProcedure,
  platformOwnerProcedure,
} from "@/integrations/trpc/init";
import { resetAcademySetting, updateAcademySetting } from "./academy-mutations";
import { listAcademySettings } from "./academy-queries";
import { updateSystemSetting } from "./mutations";
import { listSystemSettings } from "./queries";
import {
  resetAcademySettingSchema,
  updateAcademySettingSchema,
  updateSystemSettingSchema,
} from "./schemas";

/**
 * One academy's own preferences (design doc `academy-preferences.md`), edited
 * by that academy's admins. The academy is always the caller's active org —
 * there is no `organizationId` input, so one academy can never reach
 * another's rows.
 */
const academySettingsRouter = createTRPCRouter({
  list: orgAdminProcedure.query(async ({ ctx }) => listAcademySettings(ctx)),
  update: orgAdminProcedure
    .input(updateAcademySettingSchema)
    .mutation(async ({ ctx, input }) => updateAcademySetting(ctx, input)),
  reset: orgAdminProcedure
    .input(resetAcademySettingSchema)
    .mutation(async ({ ctx, input }) => resetAcademySetting(ctx, input)),
});

/**
 * Deployment-wide settings, managed by the platform owner only
 * (`users.isPlatformOwner`, design doc `academy-preferences.md` R1). These
 * values — the Meetings URL, API key and webhook secret — are what make live
 * classes work for every academy on the deployment, so they belong to whoever
 * runs the deployment, not to any one academy's admin. The gate ignores the
 * active org: the owner reaches these from whichever academy they have open.
 */
export const settingsRouter = createTRPCRouter({
  list: platformOwnerProcedure.query(async ({ ctx }) =>
    listSystemSettings(ctx),
  ),
  update: platformOwnerProcedure
    .input(updateSystemSettingSchema)
    .mutation(async ({ ctx, input }) => updateSystemSetting(ctx, input)),
  academy: academySettingsRouter,
});
