CREATE TABLE "teacher_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"teacherId" uuid NOT NULL,
	"day" integer NOT NULL,
	"startTime" varchar(5) NOT NULL,
	"endTime" varchar(5) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now(),
	CONSTRAINT "teacher_availability_teacher_day_start_unique" UNIQUE("organizationId","teacherId","day","startTime")
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "plannedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "adjustedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "teacher_availability" ADD CONSTRAINT "teacher_availability_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_availability" ADD CONSTRAINT "teacher_availability_teacherId_users_id_fk" FOREIGN KEY ("teacherId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_availability" ADD CONSTRAINT "teacher_availability_membership_fk" FOREIGN KEY ("organizationId","teacherId") REFERENCES "public"."organization_memberships"("organizationId","userId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "teacher_availability_organization_id_idx" ON "teacher_availability" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "teacher_availability_teacher_id_idx" ON "teacher_availability" USING btree ("teacherId");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_group_id_planned_at_unique" UNIQUE("groupId","plannedAt");