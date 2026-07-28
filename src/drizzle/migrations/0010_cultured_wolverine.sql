CREATE TYPE "public"."session_status" AS ENUM('scheduled', 'ongoing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"groupId" uuid NOT NULL,
	"scheduledAt" timestamp with time zone NOT NULL,
	"durationMinutes" integer NOT NULL,
	"status" "session_status" DEFAULT 'scheduled' NOT NULL,
	"teacherId" uuid,
	"lectureId" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now(),
	CONSTRAINT "sessions_group_id_scheduled_at_unique" UNIQUE("groupId","scheduledAt"),
	CONSTRAINT "sessions_organization_id_id_unique" UNIQUE("organizationId","id")
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "timeZone" varchar(64) DEFAULT 'Africa/Cairo' NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "startDate" date DEFAULT CURRENT_DATE NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "sessionCount" integer DEFAULT 12 NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_teacherId_users_id_fk" FOREIGN KEY ("teacherId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_lectureId_lectures_id_fk" FOREIGN KEY ("lectureId") REFERENCES "public"."lectures"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_organization_group_fk" FOREIGN KEY ("organizationId","groupId") REFERENCES "public"."groups"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sessions_organization_id_idx" ON "sessions" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "sessions_group_id_idx" ON "sessions" USING btree ("groupId");--> statement-breakpoint
CREATE INDEX "sessions_scheduled_at_idx" ON "sessions" USING btree ("scheduledAt");--> statement-breakpoint
CREATE INDEX "sessions_status_idx" ON "sessions" USING btree ("status");