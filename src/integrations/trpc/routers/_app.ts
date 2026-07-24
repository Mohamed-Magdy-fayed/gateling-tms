import { organizationsRouter } from "@/features/core/organizations/server";
import { contactRouter } from "@/features/marketing/server/router";
import { createTRPCRouter } from "../init";
import { demoRouter } from "./demo";
import { healthRouter } from "./health";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  demo: demoRouter,
  organizations: organizationsRouter,
  contact: contactRouter,
});

export type AppRouter = typeof appRouter;
