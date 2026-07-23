import { organizationsRouter } from "@/features/core/organizations/server";
import { createTRPCRouter } from "../init";
import { demoRouter } from "./demo";
import { healthRouter } from "./health";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  demo: demoRouter,
  organizations: organizationsRouter,
});

export type AppRouter = typeof appRouter;
