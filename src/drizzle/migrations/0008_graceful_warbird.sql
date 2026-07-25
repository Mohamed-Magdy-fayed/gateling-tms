CREATE TYPE "public"."enrollment_level_status" AS ENUM('notStarted', 'inProgress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('placementTest', 'waiting', 'ongoing', 'completed', 'cancelled', 'postponed');--> statement-breakpoint
CREATE TYPE "public"."group_status" AS ENUM('active', 'paused', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."placement_test_status" AS ENUM('pending', 'inProgress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"traineeId" uuid NOT NULL,
	"courseId" uuid,
	"groupId" uuid,
	"title" varchar(256) NOT NULL,
	"issuedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"fileUrl" varchar(2048),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "certificates_organization_id_id_unique" UNIQUE("organizationId","id")
);
--> statement-breakpoint
CREATE TABLE "enrollment_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"enrollmentId" uuid NOT NULL,
	"levelId" uuid NOT NULL,
	"status" "enrollment_level_status" DEFAULT 'notStarted' NOT NULL,
	"completedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now(),
	CONSTRAINT "enrollment_levels_enrollment_id_level_id_unique" UNIQUE("enrollmentId","levelId")
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"traineeId" uuid NOT NULL,
	"courseId" uuid NOT NULL,
	"status" "enrollment_status" DEFAULT 'waiting' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now(),
	CONSTRAINT "enrollments_organization_id_id_unique" UNIQUE("organizationId","id")
);
--> statement-breakpoint
CREATE TABLE "group_students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"groupId" uuid NOT NULL,
	"traineeId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "group_students_group_id_trainee_id_unique" UNIQUE("groupId","traineeId")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"name" varchar(256) NOT NULL,
	"courseId" uuid,
	"teacherId" uuid,
	"schedule" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "group_status" DEFAULT 'active' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now(),
	CONSTRAINT "groups_organization_id_id_unique" UNIQUE("organizationId","id")
);
--> statement-breakpoint
CREATE TABLE "placement_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"traineeId" uuid NOT NULL,
	"formId" uuid,
	"assignedLevelId" uuid,
	"status" "placement_test_status" DEFAULT 'pending' NOT NULL,
	"feedback" text,
	"scheduledAt" timestamp with time zone,
	"completedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now(),
	CONSTRAINT "placement_tests_organization_id_id_unique" UNIQUE("organizationId","id")
);
--> statement-breakpoint
CREATE TABLE "trainees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"name" varchar(256) NOT NULL,
	"phone" varchar(32),
	"email" varchar(256),
	"userId" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" varchar NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now(),
	"updatedBy" varchar,
	"deletedAt" timestamp with time zone,
	"deletedBy" varchar,
	CONSTRAINT "trainees_organization_id_id_unique" UNIQUE("organizationId","id")
);
--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_organization_trainee_fk" FOREIGN KEY ("organizationId","traineeId") REFERENCES "public"."trainees"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_organization_course_fk" FOREIGN KEY ("organizationId","courseId") REFERENCES "public"."courses"("organizationId","id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_organization_group_fk" FOREIGN KEY ("organizationId","groupId") REFERENCES "public"."groups"("organizationId","id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_levels" ADD CONSTRAINT "enrollment_levels_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_levels" ADD CONSTRAINT "enrollment_levels_organization_enrollment_fk" FOREIGN KEY ("organizationId","enrollmentId") REFERENCES "public"."enrollments"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_levels" ADD CONSTRAINT "enrollment_levels_organization_level_fk" FOREIGN KEY ("organizationId","levelId") REFERENCES "public"."levels"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_organization_trainee_fk" FOREIGN KEY ("organizationId","traineeId") REFERENCES "public"."trainees"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_organization_course_fk" FOREIGN KEY ("organizationId","courseId") REFERENCES "public"."courses"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_students" ADD CONSTRAINT "group_students_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_students" ADD CONSTRAINT "group_students_organization_group_fk" FOREIGN KEY ("organizationId","groupId") REFERENCES "public"."groups"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_students" ADD CONSTRAINT "group_students_organization_trainee_fk" FOREIGN KEY ("organizationId","traineeId") REFERENCES "public"."trainees"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_teacherId_users_id_fk" FOREIGN KEY ("teacherId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_organization_course_fk" FOREIGN KEY ("organizationId","courseId") REFERENCES "public"."courses"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tests" ADD CONSTRAINT "placement_tests_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tests" ADD CONSTRAINT "placement_tests_organization_trainee_fk" FOREIGN KEY ("organizationId","traineeId") REFERENCES "public"."trainees"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tests" ADD CONSTRAINT "placement_tests_organization_form_fk" FOREIGN KEY ("organizationId","formId") REFERENCES "public"."forms"("organizationId","id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tests" ADD CONSTRAINT "placement_tests_organization_level_fk" FOREIGN KEY ("organizationId","assignedLevelId") REFERENCES "public"."levels"("organizationId","id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainees" ADD CONSTRAINT "trainees_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainees" ADD CONSTRAINT "trainees_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "certificates_organization_id_idx" ON "certificates" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "certificates_trainee_id_idx" ON "certificates" USING btree ("traineeId");--> statement-breakpoint
CREATE INDEX "enrollment_levels_organization_id_idx" ON "enrollment_levels" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "enrollment_levels_enrollment_id_idx" ON "enrollment_levels" USING btree ("enrollmentId");--> statement-breakpoint
CREATE INDEX "enrollments_organization_id_idx" ON "enrollments" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "enrollments_trainee_id_idx" ON "enrollments" USING btree ("traineeId");--> statement-breakpoint
CREATE INDEX "enrollments_course_id_idx" ON "enrollments" USING btree ("courseId");--> statement-breakpoint
CREATE INDEX "enrollments_status_idx" ON "enrollments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "group_students_organization_id_idx" ON "group_students" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "group_students_group_id_idx" ON "group_students" USING btree ("groupId");--> statement-breakpoint
CREATE INDEX "group_students_trainee_id_idx" ON "group_students" USING btree ("traineeId");--> statement-breakpoint
CREATE INDEX "groups_organization_id_idx" ON "groups" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "groups_course_id_idx" ON "groups" USING btree ("courseId");--> statement-breakpoint
CREATE INDEX "groups_teacher_id_idx" ON "groups" USING btree ("teacherId");--> statement-breakpoint
CREATE INDEX "placement_tests_organization_id_idx" ON "placement_tests" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "placement_tests_trainee_id_idx" ON "placement_tests" USING btree ("traineeId");--> statement-breakpoint
CREATE INDEX "placement_tests_status_idx" ON "placement_tests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trainees_organization_id_idx" ON "trainees" USING btree ("organizationId");