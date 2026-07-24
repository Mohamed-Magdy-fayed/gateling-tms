import {
  createTRPCRouter,
  orgContentManagerProcedure,
} from "@/integrations/trpc/init";
import { deleteOrgImage, uploadOrgImage } from "./mutations";
import { deleteImageInput, uploadImageInput } from "./schemas";

export const uploadsRouter = createTRPCRouter({
  uploadImage: orgContentManagerProcedure
    .input(uploadImageInput)
    .mutation(async ({ ctx, input }) => uploadOrgImage(ctx, input)),
  deleteImage: orgContentManagerProcedure
    .input(deleteImageInput)
    .mutation(async ({ ctx, input }) => deleteOrgImage(ctx, input)),
});
