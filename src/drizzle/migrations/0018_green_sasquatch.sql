ALTER TABLE "zoom_clients" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "zoom_clients" CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "meetingAccountId" uuid;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "meetingNumber" varchar(64);--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "joinUrl" varchar(1024);--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "startUrl" varchar(2048);--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_organization_meeting_account_fk" FOREIGN KEY ("organizationId","meetingAccountId") REFERENCES "public"."meeting_accounts"("organizationId","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sessions_meeting_account_id_idx" ON "sessions" USING btree ("meetingAccountId");--> statement-breakpoint
DROP TYPE "public"."zoom_client_status";