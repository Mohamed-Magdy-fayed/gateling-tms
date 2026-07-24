import {
  createTRPCRouter,
  orgContentManagerProcedure,
  orgProcedure,
} from "@/integrations/trpc/init";
import { createForm, deleteForm, updateForm } from "./mutations";
import { getForm, getFormTree, listForms } from "./queries";
import {
  formDeleteSchema,
  formMutationSchema,
  formUpdateSchema,
  listFormsInput,
} from "./schemas";

export const formsRouter = createTRPCRouter({
  list: orgProcedure
    .input(listFormsInput)
    .query(async ({ ctx, input }) => listForms(ctx, input)),
  // Reuses formDeleteSchema — same {id} shape, no need for a near-duplicate.
  get: orgProcedure
    .input(formDeleteSchema)
    .query(async ({ ctx, input }) => getForm(ctx, input.id)),
  // Reuses formDeleteSchema — same {id} shape.
  getTree: orgProcedure
    .input(formDeleteSchema)
    .query(async ({ ctx, input }) => getFormTree(ctx, input.id)),
  create: orgContentManagerProcedure
    .input(formMutationSchema)
    .mutation(async ({ ctx, input }) => createForm(ctx, input)),
  update: orgContentManagerProcedure
    .input(formUpdateSchema)
    .mutation(async ({ ctx, input }) => updateForm(ctx, input)),
  delete: orgContentManagerProcedure
    .input(formDeleteSchema)
    .mutation(async ({ ctx, input }) => deleteForm(ctx, input)),
});
