import {
  createTRPCRouter,
  orgContentManagerProcedure,
  orgProcedure,
} from "@/integrations/trpc/init";
import { createCourse, deleteCourse, updateCourse } from "./mutations";
import { listCourses } from "./queries";
import {
  courseDeleteSchema,
  courseMutationSchema,
  courseUpdateSchema,
  listCoursesInput,
} from "./schemas";

export const coursesRouter = createTRPCRouter({
  // Any org member (including students) can browse the course list.
  list: orgProcedure
    .input(listCoursesInput)
    .query(async ({ ctx, input }) => listCourses(ctx, input)),
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
