import { organizationsRouter } from "@/features/core/organizations/server";
import { uploadsRouter } from "@/features/core/uploads/server";
import { contactRouter } from "@/features/marketing/server/router";
import { answersRouter } from "@/features/system/assessments/answers/server";
import { formsRouter } from "@/features/system/assessments/forms/server";
import { questionsRouter } from "@/features/system/assessments/questions/server";
import { responsesRouter } from "@/features/system/assessments/responses/server";
import { sectionsRouter } from "@/features/system/assessments/sections/server";
import { coursesRouter } from "@/features/system/content-library/courses/server";
import { lecturesRouter } from "@/features/system/content-library/lectures/server";
import { levelsRouter } from "@/features/system/content-library/levels/server";
import { createTRPCRouter } from "../init";
import { healthRouter } from "./health";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  organizations: organizationsRouter,
  uploads: uploadsRouter,
  contact: contactRouter,
  courses: coursesRouter,
  levels: levelsRouter,
  lectures: lecturesRouter,
  forms: formsRouter,
  sections: sectionsRouter,
  questions: questionsRouter,
  answers: answersRouter,
  responses: responsesRouter,
});

export type AppRouter = typeof appRouter;
