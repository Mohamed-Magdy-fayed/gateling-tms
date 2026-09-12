-- Written with IF EXISTS throughout: production's sessions↔meeting_accounts
-- objects did not all exist under the names the migration history gives them
-- (the deploy failed on the FK by name), and dropping the column removes any
-- constraint on it whatever it is called. Every statement converges on the
-- same end state from either shape.
ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_organization_meeting_account_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "sessions_meeting_account_id_idx";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "meetingAccountId";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "meetingNumber";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "startUrl";--> statement-breakpoint
DROP TABLE IF EXISTS "meeting_accounts" CASCADE;--> statement-breakpoint
DROP TYPE IF EXISTS "public"."meeting_account_status";
