import {
  createTRPCRouter,
  orgContentManagerProcedure,
  orgProcedure,
} from "@/integrations/trpc/init";
import { commitLevelImport, previewLevelImport } from "./import";
import { createLevel, deleteLevel, moveLevel, updateLevel } from "./mutations";
import { listLevels } from "./queries";
import {
  levelDeleteSchema,
  levelImportCommitInput,
  levelImportPreviewInput,
  levelMoveSchema,
  levelMutationSchema,
  levelUpdateSchema,
  listLevelsInput,
} from "./schemas";

export const levelsRouter = createTRPCRouter({
  list: orgProcedure
    .input(listLevelsInput)
    .query(async ({ ctx, input }) => listLevels(ctx, input)),
  create: orgContentManagerProcedure
    .input(levelMutationSchema)
    .mutation(async ({ ctx, input }) => createLevel(ctx, input)),
  update: orgContentManagerProcedure
    .input(levelUpdateSchema)
    .mutation(async ({ ctx, input }) => updateLevel(ctx, input)),
  delete: orgContentManagerProcedure
    .input(levelDeleteSchema)
    .mutation(async ({ ctx, input }) => deleteLevel(ctx, input)),
  move: orgContentManagerProcedure
    .input(levelMoveSchema)
    .mutation(async ({ ctx, input }) => moveLevel(ctx, input)),
  // Mutations, not queries: both take a file body, and re-running a preview
  // for the same file is the point rather than something to cache.
  importPreview: orgContentManagerProcedure
    .input(levelImportPreviewInput)
    .mutation(async ({ ctx, input }) => previewLevelImport(ctx, input)),
  importCommit: orgContentManagerProcedure
    .input(levelImportCommitInput)
    .mutation(async ({ ctx, input }) => commitLevelImport(ctx, input)),
});
