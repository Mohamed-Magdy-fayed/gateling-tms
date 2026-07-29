CREATE TYPE "public"."attendance_source" AS ENUM('zoom', 'manual');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent');--> statement-breakpoint
CREATE TABLE "session_students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"sessionId" uuid NOT NULL,
	"traineeId" uuid NOT NULL,
	"status" "attendance_status" NOT NULL,
	"source" "attendance_source" NOT NULL,
	"joinedAt" timestamp with time zone,
	"leftAt" timestamp with time zone,
	"attendedMinutes" integer DEFAULT 0 NOT NULL,
	"markedBy" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now(),
	CONSTRAINT "session_students_session_id_trainee_id_unique" UNIQUE("sessionId","traineeId")
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "zoomRecordingUrl" varchar(2048);--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "zoomRecordingPassword" varchar(64);--> statement-breakpoint
ALTER TABLE "session_students" ADD CONSTRAINT "session_students_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_students" ADD CONSTRAINT "session_students_markedBy_users_id_fk" FOREIGN KEY ("markedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_students" ADD CONSTRAINT "session_students_organization_session_fk" FOREIGN KEY ("organizationId","sessionId") REFERENCES "public"."sessions"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_students" ADD CONSTRAINT "session_students_organization_trainee_fk" FOREIGN KEY ("organizationId","traineeId") REFERENCES "public"."trainees"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_students_organization_id_idx" ON "session_students" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "session_students_session_id_idx" ON "session_students" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "session_students_trainee_id_idx" ON "session_students" USING btree ("traineeId");