import {
  createTRPCRouter,
  orgContentManagerProcedure,
} from "@/integrations/trpc/init";
import {
  createTraineeNote,
  deleteTraineeNote,
  updateTraineeNote,
} from "./mutations";
import { listTraineeNotes } from "./queries";
import {
  listTraineeNotesInput,
  traineeNoteDeleteSchema,
  traineeNoteMutationSchema,
  traineeNoteUpdateSchema,
} from "./schemas";

/**
 * Admin/teacher-only, reads included: a note is staff's private remark about
 * a student, which is the last thing a `student` membership should be able
 * to read — the same line `trainees.get` and `certificates.list` draw.
 */
export const traineeNotesRouter = createTRPCRouter({
  list: orgContentManagerProcedure
    .input(listTraineeNotesInput)
    .query(async ({ ctx, input }) => listTraineeNotes(ctx, input)),
  create: orgContentManagerProcedure
    .input(traineeNoteMutationSchema)
    .mutation(async ({ ctx, input }) => createTraineeNote(ctx, input)),
  update: orgContentManagerProcedure
    .input(traineeNoteUpdateSchema)
    .mutation(async ({ ctx, input }) => updateTraineeNote(ctx, input)),
  delete: orgContentManagerProcedure
    .input(traineeNoteDeleteSchema)
    .mutation(async ({ ctx, input }) => deleteTraineeNote(ctx, input)),
});
