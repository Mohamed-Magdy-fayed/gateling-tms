import {
  createTRPCRouter,
  orgContentManagerProcedure,
  orgProcedure,
} from "@/integrations/trpc/init";
import { createBlock, deleteBlock, moveBlock, updateBlock } from "./mutations";
import { listBlocks } from "./queries";
import {
  blockDeleteSchema,
  blockMoveSchema,
  blockMutationSchema,
  blockUpdateSchema,
  listBlocksInput,
} from "./schemas";

export const blocksRouter = createTRPCRouter({
  list: orgProcedure
    .input(listBlocksInput)
    .query(async ({ ctx, input }) => listBlocks(ctx, input)),
  create: orgContentManagerProcedure
    .input(blockMutationSchema)
    .mutation(async ({ ctx, input }) => createBlock(ctx, input)),
  update: orgContentManagerProcedure
    .input(blockUpdateSchema)
    .mutation(async ({ ctx, input }) => updateBlock(ctx, input)),
  delete: orgContentManagerProcedure
    .input(blockDeleteSchema)
    .mutation(async ({ ctx, input }) => deleteBlock(ctx, input)),
  move: orgContentManagerProcedure
    .input(blockMoveSchema)
    .mutation(async ({ ctx, input }) => moveBlock(ctx, input)),
});
