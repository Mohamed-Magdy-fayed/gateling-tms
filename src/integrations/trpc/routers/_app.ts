import { organizationsRouter } from "@/features/core/organizations/server";
import { uploadsRouter } from "@/features/core/uploads/server";
import { contactRouter } from "@/features/marketing/server/router";
import { answersRouter } from "@/features/system/assessments/answers/server";
import { formsRouter } from "@/features/system/assessments/forms/server";
import { googleImportRouter } from "@/features/system/assessments/google-import/server";
import { questionsRouter } from "@/features/system/assessments/questions/server";
import { responsesRouter } from "@/features/system/assessments/responses/server";
import { sectionsRouter } from "@/features/system/assessments/sections/server";
import { coursesRouter } from "@/features/system/content-library/courses/server";
import { lecturesRouter } from "@/features/system/content-library/lectures/server";
import { levelsRouter } from "@/features/system/content-library/levels/server";
import { dashboardRouter } from "@/features/system/dashboard/server";
import { certificatesRouter } from "@/features/system/learning-flow/certificates/server";
import { enrollmentsRouter } from "@/features/system/learning-flow/enrollments/server";
import { groupsRouter } from "@/features/system/learning-flow/groups/server";
import { placementTestsRouter } from "@/features/system/learning-flow/placement-tests/server";
import { progressRouter } from "@/features/system/learning-flow/progress/server";
import { traineesRouter } from "@/features/system/learning-flow/trainees/server";
import { attendanceRouter } from "@/features/system/live-classes/attendance/server";
import { meetingAccountsRouter } from "@/features/system/live-classes/meeting-accounts/server";
import { sessionsRouter } from "@/features/system/live-classes/sessions/server";
import { zoomClientsRouter } from "@/features/system/live-classes/zoom-clients/server";
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
  googleImport: googleImportRouter,
  trainees: traineesRouter,
  groups: groupsRouter,
  enrollments: enrollmentsRouter,
  placementTests: placementTestsRouter,
  certificates: certificatesRouter,
  progress: progressRouter,
  dashboard: dashboardRouter,
  zoomClients: zoomClientsRouter,
  meetingAccounts: meetingAccountsRouter,
  sessions: sessionsRouter,
  attendance: attendanceRouter,
});

export type AppRouter = typeof appRouter;
