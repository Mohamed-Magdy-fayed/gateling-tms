import { authRouter } from "@/server/api/routers/auth-router";
import { coursesRouter } from "@/server/api/routers/content/courses-router";
import { filesRouter } from "@/server/api/routers/content/files-router";
import { levelsRouter } from "@/server/api/routers/content/levels-router";
import { materialsRouter } from "@/server/api/routers/content/materials-router";
import { getStartedRouter } from "@/server/api/routers/get-started-router";
import { subscriptionRouter as subscription } from "@/server/api/routers/subscription-router";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  getStartedRouter,
  coursesRouter,
  levelsRouter,
  materialsRouter,
  filesRouter,
  authRouter,
  subscription,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
