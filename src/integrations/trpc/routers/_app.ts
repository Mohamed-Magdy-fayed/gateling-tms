import { organizationsRouter } from "@/features/core/organizations/server";
import { uploadsRouter } from "@/features/core/uploads/server";
import { contactRouter } from "@/features/marketing/server/router";
import { testimonialsRouter } from "@/features/marketing/testimonials/server";
import { answersRouter } from "@/features/system/assessments/answers/server";
import { blocksRouter } from "@/features/system/assessments/blocks/server";
import { formsRouter } from "@/features/system/assessments/forms/server";
import { googleImportRouter } from "@/features/system/assessments/google-import/server";
import { questionsRouter } from "@/features/system/assessments/questions/server";
import { responsesRouter } from "@/features/system/assessments/responses/server";
import { sectionsRouter } from "@/features/system/assessments/sections/server";
import { coursesRouter } from "@/features/system/content-library/courses/server";
import { lecturesRouter } from "@/features/system/content-library/lectures/server";
import { levelsRouter } from "@/features/system/content-library/levels/server";
import { dashboardRouter } from "@/features/system/dashboard/server";
import { attendanceRouter } from "@/features/system/live-classes/attendance/server";
import { teacherAvailabilityRouter } from "@/features/system/live-classes/availability/server";
import { sessionsRouter } from "@/features/system/live-classes/sessions/server";
import { settingsRouter } from "@/features/system/settings/server";
import { certificatesRouter } from "@/features/system/students/certificates/server";
import { enrollmentsRouter } from "@/features/system/students/enrollments/server";
import { groupsRouter } from "@/features/system/students/groups/server";
import { traineeNotesRouter } from "@/features/system/students/notes/server";
import { paymentsRouter } from "@/features/system/students/payments/server";
import { placementTestsRouter } from "@/features/system/students/placement-tests/server";
import { progressRouter } from "@/features/system/students/progress/server";
import { traineesRouter } from "@/features/system/students/trainees/server";
import { createTRPCRouter } from "../init";
import { healthRouter } from "./health";

export const appRouter = createTRPCRouter({
  health: healthRouter,
  organizations: organizationsRouter,
  uploads: uploadsRouter,
  contact: contactRouter,
  testimonials: testimonialsRouter,
  courses: coursesRouter,
  levels: levelsRouter,
  lectures: lecturesRouter,
  forms: formsRouter,
  sections: sectionsRouter,
  questions: questionsRouter,
  blocks: blocksRouter,
  answers: answersRouter,
  responses: responsesRouter,
  googleImport: googleImportRouter,
  trainees: traineesRouter,
  groups: groupsRouter,
  enrollments: enrollmentsRouter,
  placementTests: placementTestsRouter,
  certificates: certificatesRouter,
  traineeNotes: traineeNotesRouter,
  payments: paymentsRouter,
  progress: progressRouter,
  dashboard: dashboardRouter,
  sessions: sessionsRouter,
  attendance: attendanceRouter,
  teacherAvailability: teacherAvailabilityRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
