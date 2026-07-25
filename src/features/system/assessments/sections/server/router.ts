import {
  createTRPCRouter,
  orgContentManagerProcedure,
  orgProcedure,
} from "@/integrations/trpc/init";
import {
  createSection,
  deleteSection,
  moveSection,
  updateSection,
} from "./mutations";
import { listSections } from "./queries";
import {
  listSectionsInput,
  sectionDeleteSchema,
  sectionMoveSchema,
  sectionMutationSchema,
  sectionUpdateSchema,
} from "./schemas";

export const sectionsRouter = createTRPCRouter({
  list: orgProcedure
    .input(listSectionsInput)
    .query(async ({ ctx, input }) => listSections(ctx, input)),
  create: orgContentManagerProcedure
    .input(sectionMutationSchema)
    .mutation(async ({ ctx, input }) => createSection(ctx, input)),
  update: orgContentManagerProcedure
    .input(sectionUpdateSchema)
    .mutation(async ({ ctx, input }) => updateSection(ctx, input)),
  delete: orgContentManagerProcedure
    .input(sectionDeleteSchema)
    .mutation(async ({ ctx, input }) => deleteSection(ctx, input)),
  move: orgContentManagerProcedure
    .input(sectionMoveSchema)
    .mutation(async ({ ctx, input }) => moveSection(ctx, input)),
});
