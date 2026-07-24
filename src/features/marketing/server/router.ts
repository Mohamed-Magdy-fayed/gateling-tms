import { createTRPCRouter, publicProcedure } from "@/integrations/trpc/init";
import { submitContactMessage } from "./mutations";
import { contactMessageSchema } from "./schemas";

export const contactRouter = createTRPCRouter({
  submit: publicProcedure
    .input(contactMessageSchema)
    .mutation(async ({ ctx, input }) => submitContactMessage(ctx, input)),
});
