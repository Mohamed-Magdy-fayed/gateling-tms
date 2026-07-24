import {
  createTRPCRouter,
  orgContentManagerProcedure,
  orgProcedure,
} from "@/integrations/trpc/init";
import { createCourse, deleteCourse, updateCourse } from "./mutations";
import { getCourse, listCourses } from "./queries";
import {
  courseDeleteSchema,
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
});
