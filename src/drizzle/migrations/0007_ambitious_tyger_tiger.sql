ALTER TABLE "answers" DROP CONSTRAINT "answers_questionId_questions_id_fk";
--> statement-breakpoint
ALTER TABLE "form_responses" DROP CONSTRAINT "form_responses_formId_forms_id_fk";
--> statement-breakpoint
ALTER TABLE "form_sections" DROP CONSTRAINT "form_sections_formId_forms_id_fk";
--> statement-breakpoint
ALTER TABLE "forms" DROP CONSTRAINT "forms_courseId_courses_id_fk";
--> statement-breakpoint
ALTER TABLE "forms" DROP CONSTRAINT "forms_levelId_levels_id_fk";
--> statement-breakpoint
ALTER TABLE "forms" DROP CONSTRAINT "forms_lectureId_lectures_id_fk";
--> statement-breakpoint
ALTER TABLE "questions" DROP CONSTRAINT "questions_sectionId_form_sections_id_fk";
--> statement-breakpoint
ALTER TABLE "lectures" DROP CONSTRAINT "lectures_levelId_levels_id_fk";
--> statement-breakpoint
ALTER TABLE "levels" DROP CONSTRAINT "levels_courseId_courses_id_fk";
--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_organization_id_id_unique" UNIQUE("organizationId","id");--> statement-breakpoint
ALTER TABLE "form_sections" ADD CONSTRAINT "form_sections_organization_id_id_unique" UNIQUE("organizationId","id");--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_organization_id_id_unique" UNIQUE("organizationId","id");--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_organization_id_id_unique" UNIQUE("organizationId","id");--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_organization_id_id_unique" UNIQUE("organizationId","id");--> statement-breakpoint
ALTER TABLE "lectures" ADD CONSTRAINT "lectures_organization_id_id_unique" UNIQUE("organizationId","id");--> statement-breakpoint
ALTER TABLE "levels" ADD CONSTRAINT "levels_organization_id_id_unique" UNIQUE("organizationId","id");--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_organization_question_fk" FOREIGN KEY ("organizationId","questionId") REFERENCES "public"."questions"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_organization_form_fk" FOREIGN KEY ("organizationId","formId") REFERENCES "public"."forms"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_sections" ADD CONSTRAINT "form_sections_organization_form_fk" FOREIGN KEY ("organizationId","formId") REFERENCES "public"."forms"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_organization_course_fk" FOREIGN KEY ("organizationId","courseId") REFERENCES "public"."courses"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_organization_level_fk" FOREIGN KEY ("organizationId","levelId") REFERENCES "public"."levels"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_organization_lecture_fk" FOREIGN KEY ("organizationId","lectureId") REFERENCES "public"."lectures"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_organization_section_fk" FOREIGN KEY ("organizationId","sectionId") REFERENCES "public"."form_sections"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lectures" ADD CONSTRAINT "lectures_organization_level_fk" FOREIGN KEY ("organizationId","levelId") REFERENCES "public"."levels"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "levels" ADD CONSTRAINT "levels_organization_course_fk" FOREIGN KEY ("organizationId","courseId") REFERENCES "public"."courses"("organizationId","id") ON DELETE cascade ON UPDATE no action;
