import { createTRPCRouter } from "../init";
import { demoRouter } from "./demo";
import { healthRouter } from "./health";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  demo: demoRouter,
});

export type AppRouter = typeof appRouter;
