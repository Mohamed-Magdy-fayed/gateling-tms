ALTER TABLE "certificates" DROP CONSTRAINT "certificates_organization_course_fk";
--> statement-breakpoint
ALTER TABLE "certificates" DROP CONSTRAINT "certificates_organization_group_fk";
--> statement-breakpoint
ALTER TABLE "placement_tests" DROP CONSTRAINT "placement_tests_organization_form_fk";
--> statement-breakpoint
ALTER TABLE "placement_tests" DROP CONSTRAINT "placement_tests_organization_level_fk";
--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_groupId_groups_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tests" ADD CONSTRAINT "placement_tests_formId_forms_id_fk" FOREIGN KEY ("formId") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tests" ADD CONSTRAINT "placement_tests_assignedLevelId_levels_id_fk" FOREIGN KEY ("assignedLevelId") REFERENCES "public"."levels"("id") ON DELETE set null ON UPDATE no action;