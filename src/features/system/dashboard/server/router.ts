import {
  createTRPCRouter,
  orgContentManagerProcedure,
  orgProcedure,
} from "@/integrations/trpc/init";
import { getDashboardOverview, getRecentActivity } from "./queries";

export const dashboardRouter = createTRPCRouter({
  // Counts and today's schedule carry no trainee PII, so any member of the
  // organization can read them.
  overview: orgProcedure.query(async ({ ctx }) => getDashboardOverview(ctx)),
  // This one names trainees — admin/teacher only, same call as D75(1)/D86.
  recentActivity: orgContentManagerProcedure.query(async ({ ctx }) =>
    getRecentActivity(ctx),
  ),
});
