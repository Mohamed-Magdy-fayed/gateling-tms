CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"address" varchar(512),
	"phone" varchar(32),
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now(),
	CONSTRAINT "branches_organization_id_name_unique" UNIQUE("organizationId","name"),
	CONSTRAINT "branches_organization_id_id_unique" UNIQUE("organizationId","id")
);
--> statement-breakpoint
CREATE TABLE "organization_membership_branches" (
	"organizationId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"branchId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_membership_branches_userId_branchId_pk" PRIMARY KEY("userId","branchId")
);
--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "branchId" uuid;--> statement-breakpoint
ALTER TABLE "enrollment_levels" ADD COLUMN "branchId" uuid;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "branchId" uuid;--> statement-breakpoint
ALTER TABLE "group_students" ADD COLUMN "branchId" uuid;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "branchId" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "branchId" uuid;--> statement-breakpoint
ALTER TABLE "placement_tests" ADD COLUMN "branchId" uuid;--> statement-breakpoint
ALTER TABLE "session_students" ADD COLUMN "branchId" uuid;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "branchId" uuid;--> statement-breakpoint
ALTER TABLE "teacher_availability" ADD COLUMN "branchId" uuid;--> statement-breakpoint
ALTER TABLE "trainee_notes" ADD COLUMN "branchId" uuid;--> statement-breakpoint
ALTER TABLE "trainees" ADD COLUMN "branchId" uuid;--> statement-breakpoint
-- Data step (hand-written): every existing academy gets one "Main" branch and
-- all of its branch-owned rows move into it, so existing academies behave
-- exactly as before. Then the column becomes NOT NULL.
INSERT INTO "branches" ("organizationId", "name") SELECT "id", 'Main' FROM "organizations";--> statement-breakpoint
UPDATE "certificates" AS t SET "branchId" = b."id" FROM "branches" AS b WHERE b."organizationId" = t."organizationId" AND t."branchId" IS NULL;--> statement-breakpoint
UPDATE "enrollment_levels" AS t SET "branchId" = b."id" FROM "branches" AS b WHERE b."organizationId" = t."organizationId" AND t."branchId" IS NULL;--> statement-breakpoint
UPDATE "enrollments" AS t SET "branchId" = b."id" FROM "branches" AS b WHERE b."organizationId" = t."organizationId" AND t."branchId" IS NULL;--> statement-breakpoint
UPDATE "group_students" AS t SET "branchId" = b."id" FROM "branches" AS b WHERE b."organizationId" = t."organizationId" AND t."branchId" IS NULL;--> statement-breakpoint
UPDATE "groups" AS t SET "branchId" = b."id" FROM "branches" AS b WHERE b."organizationId" = t."organizationId" AND t."branchId" IS NULL;--> statement-breakpoint
UPDATE "payments" AS t SET "branchId" = b."id" FROM "branches" AS b WHERE b."organizationId" = t."organizationId" AND t."branchId" IS NULL;--> statement-breakpoint
UPDATE "placement_tests" AS t SET "branchId" = b."id" FROM "branches" AS b WHERE b."organizationId" = t."organizationId" AND t."branchId" IS NULL;--> statement-breakpoint
UPDATE "session_students" AS t SET "branchId" = b."id" FROM "branches" AS b WHERE b."organizationId" = t."organizationId" AND t."branchId" IS NULL;--> statement-breakpoint
UPDATE "sessions" AS t SET "branchId" = b."id" FROM "branches" AS b WHERE b."organizationId" = t."organizationId" AND t."branchId" IS NULL;--> statement-breakpoint
UPDATE "teacher_availability" AS t SET "branchId" = b."id" FROM "branches" AS b WHERE b."organizationId" = t."organizationId" AND t."branchId" IS NULL;--> statement-breakpoint
UPDATE "trainee_notes" AS t SET "branchId" = b."id" FROM "branches" AS b WHERE b."organizationId" = t."organizationId" AND t."branchId" IS NULL;--> statement-breakpoint
UPDATE "trainees" AS t SET "branchId" = b."id" FROM "branches" AS b WHERE b."organizationId" = t."organizationId" AND t."branchId" IS NULL;--> statement-breakpoint
ALTER TABLE "certificates" ALTER COLUMN "branchId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "enrollment_levels" ALTER COLUMN "branchId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "enrollments" ALTER COLUMN "branchId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "group_students" ALTER COLUMN "branchId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ALTER COLUMN "branchId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "branchId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_tests" ALTER COLUMN "branchId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "session_students" ALTER COLUMN "branchId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "branchId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "teacher_availability" ALTER COLUMN "branchId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "trainee_notes" ALTER COLUMN "branchId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "trainees" ALTER COLUMN "branchId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_membership_branches" ADD CONSTRAINT "organization_membership_branches_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_membership_branches" ADD CONSTRAINT "organization_membership_branches_branch_fk" FOREIGN KEY ("organizationId","branchId") REFERENCES "public"."branches"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "branches_organization_id_idx" ON "branches" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "organization_membership_branches_branch_id_idx" ON "organization_membership_branches" USING btree ("branchId");--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_organization_branch_fk" FOREIGN KEY ("organizationId","branchId") REFERENCES "public"."branches"("organizationId","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_levels" ADD CONSTRAINT "enrollment_levels_organization_branch_fk" FOREIGN KEY ("organizationId","branchId") REFERENCES "public"."branches"("organizationId","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_organization_branch_fk" FOREIGN KEY ("organizationId","branchId") REFERENCES "public"."branches"("organizationId","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_students" ADD CONSTRAINT "group_students_organization_branch_fk" FOREIGN KEY ("organizationId","branchId") REFERENCES "public"."branches"("organizationId","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_organization_branch_fk" FOREIGN KEY ("organizationId","branchId") REFERENCES "public"."branches"("organizationId","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_branch_fk" FOREIGN KEY ("organizationId","branchId") REFERENCES "public"."branches"("organizationId","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tests" ADD CONSTRAINT "placement_tests_organization_branch_fk" FOREIGN KEY ("organizationId","branchId") REFERENCES "public"."branches"("organizationId","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_students" ADD CONSTRAINT "session_students_organization_branch_fk" FOREIGN KEY ("organizationId","branchId") REFERENCES "public"."branches"("organizationId","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_organization_branch_fk" FOREIGN KEY ("organizationId","branchId") REFERENCES "public"."branches"("organizationId","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_availability" ADD CONSTRAINT "teacher_availability_organization_branch_fk" FOREIGN KEY ("organizationId","branchId") REFERENCES "public"."branches"("organizationId","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainee_notes" ADD CONSTRAINT "trainee_notes_organization_branch_fk" FOREIGN KEY ("organizationId","branchId") REFERENCES "public"."branches"("organizationId","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainees" ADD CONSTRAINT "trainees_organization_branch_fk" FOREIGN KEY ("organizationId","branchId") REFERENCES "public"."branches"("organizationId","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "certificates_branch_id_idx" ON "certificates" USING btree ("branchId");--> statement-breakpoint
CREATE INDEX "enrollment_levels_branch_id_idx" ON "enrollment_levels" USING btree ("branchId");--> statement-breakpoint
CREATE INDEX "enrollments_branch_id_idx" ON "enrollments" USING btree ("branchId");--> statement-breakpoint
CREATE INDEX "group_students_branch_id_idx" ON "group_students" USING btree ("branchId");--> statement-breakpoint
CREATE INDEX "groups_branch_id_idx" ON "groups" USING btree ("branchId");--> statement-breakpoint
CREATE INDEX "payments_branch_id_idx" ON "payments" USING btree ("branchId");--> statement-breakpoint
CREATE INDEX "placement_tests_branch_id_idx" ON "placement_tests" USING btree ("branchId");--> statement-breakpoint
CREATE INDEX "session_students_branch_id_idx" ON "session_students" USING btree ("branchId");--> statement-breakpoint
CREATE INDEX "sessions_branch_id_idx" ON "sessions" USING btree ("branchId");--> statement-breakpoint
CREATE INDEX "teacher_availability_branch_id_idx" ON "teacher_availability" USING btree ("branchId");--> statement-breakpoint
CREATE INDEX "trainee_notes_branch_id_idx" ON "trainee_notes" USING btree ("branchId");--> statement-breakpoint
CREATE INDEX "trainees_branch_id_idx" ON "trainees" USING btree ("branchId");