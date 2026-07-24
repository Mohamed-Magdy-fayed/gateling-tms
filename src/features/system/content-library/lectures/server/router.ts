import {
  createTRPCRouter,
  orgContentManagerProcedure,
  orgProcedure,
} from "@/integrations/trpc/init";
import {
  createLecture,
  deleteLecture,
  moveLecture,
  updateLecture,
} from "./mutations";
import { listLectures } from "./queries";
import {
  lectureDeleteSchema,
  lectureMoveSchema,
  lectureMutationSchema,
  lectureUpdateSchema,
  listLecturesInput,
} from "./schemas";

export const lecturesRouter = createTRPCRouter({
  list: orgProcedure
    .input(listLecturesInput)
    .query(async ({ ctx, input }) => listLectures(ctx, input)),
  create: orgContentManagerProcedure
    .input(lectureMutationSchema)
    .mutation(async ({ ctx, input }) => createLecture(ctx, input)),
  update: orgContentManagerProcedure
    .input(lectureUpdateSchema)
    .mutation(async ({ ctx, input }) => updateLecture(ctx, input)),
  delete: orgContentManagerProcedure
    .input(lectureDeleteSchema)
    .mutation(async ({ ctx, input }) => deleteLecture(ctx, input)),
  move: orgContentManagerProcedure
    .input(lectureMoveSchema)
    .mutation(async ({ ctx, input }) => moveLecture(ctx, input)),
});
