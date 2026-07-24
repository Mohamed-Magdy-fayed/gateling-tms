import { organizationsRouter } from "@/features/core/organizations/server";
import { contactRouter } from "@/features/marketing/server/router";
import { coursesRouter } from "@/features/system/content-library/courses/server";
import { createTRPCRouter } from "../init";
import { healthRouter } from "./health";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  organizations: organizationsRouter,
  contact: contactRouter,
  courses: coursesRouter,
});

export type AppRouter = typeof appRouter;
