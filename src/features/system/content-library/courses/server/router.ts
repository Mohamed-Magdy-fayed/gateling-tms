import {
  createTRPCRouter,
  orgContentManagerProcedure,
  orgProcedure,
} from "@/integrations/trpc/init";
import { commitCourseImport, previewCourseImport } from "./import";
import { createCourse, deleteCourse, updateCourse } from "./mutations";
import { getCourse, listCourses } from "./queries";
import {
  courseDeleteSchema,
  courseImportCommitInput,
  courseImportPreviewInput,
  courseMutationSchema,
  courseUpdateSchema,
  listCoursesInput,
} from "./schemas";

export const coursesRouter = createTRPCRouter({
  // Any org member (including students) can browse the course list/detail.
  list: orgProcedure
    .input(listCoursesInput)
    .query(async ({ ctx, input }) => listCourses(ctx, input)),
  // Reuses courseDeleteSchema — same {id} shape, no need for a near-duplicate.
  get: orgProcedure
    .input(courseDeleteSchema)
    .query(async ({ ctx, input }) => getCourse(ctx, input.id)),
  create: orgContentManagerProcedure
    .input(courseMutationSchema)
    .mutation(async ({ ctx, input }) => createCourse(ctx, input)),
  update: orgContentManagerProcedure
    .input(courseUpdateSchema)
    .mutation(async ({ ctx, input }) => updateCourse(ctx, input)),
  delete: orgContentManagerProcedure
    .input(courseDeleteSchema)
    .mutation(async ({ ctx, input }) => deleteCourse(ctx, input)),
  // Mutations, not queries: both take a file body, and re-running a preview
  // for the same file is the point rather than something to cache.
  importPreview: orgContentManagerProcedure
    .input(courseImportPreviewInput)
    .mutation(async ({ ctx, input }) => previewCourseImport(ctx, input)),
  importCommit: orgContentManagerProcedure
    .input(courseImportCommitInput)
    .mutation(async ({ ctx, input }) => commitCourseImport(ctx, input)),
});
