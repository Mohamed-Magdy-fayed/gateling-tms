import { createTRPCRouter, publicProcedure } from "@/integrations/trpc/init";
import { createDemoItem, deleteDemoItem, updateDemoItem } from "./mutations";
import { listDemoItems } from "./queries";
import {
  demoItemDeleteSchema,
  demoItemMutationSchema,
  demoItemUpdateSchema,
  listDemoItemsInput,
} from "./schemas";

// Org-less on purpose (see docs/rebuild/phases/phase-01.md step 10) — every
// procedure is public until this table is dropped/repurposed in Phase 4.
export const demoRouter = createTRPCRouter({
  list: publicProcedure
    .input(listDemoItemsInput)
    .query(async ({ ctx, input }) => listDemoItems(ctx, input)),
  create: publicProcedure
    .input(demoItemMutationSchema)
    .mutation(async ({ ctx, input }) => createDemoItem(ctx, input)),
  update: publicProcedure
    .input(demoItemUpdateSchema)
    .mutation(async ({ ctx, input }) => updateDemoItem(ctx, input)),
  delete: publicProcedure
    .input(demoItemDeleteSchema)
    .mutation(async ({ ctx, input }) => deleteDemoItem(ctx, input)),
});
