ALTER TYPE "public"."attendance_source" ADD VALUE 'meetings';--> statement-breakpoint
ALTER TABLE "session_students" ADD COLUMN "lateMinutes" integer DEFAULT 0 NOT NULL;