ALTER TABLE "sessions" DROP CONSTRAINT "sessions_organization_meeting_account_fk";
--> statement-breakpoint
DROP INDEX "sessions_meeting_account_id_idx";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "meetingAccountId";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "meetingNumber";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "startUrl";--> statement-breakpoint
ALTER TABLE "meeting_accounts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "meeting_accounts" CASCADE;--> statement-breakpoint
DROP TYPE "public"."meeting_account_status";
