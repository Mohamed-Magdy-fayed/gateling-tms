ALTER TABLE "sessions" ADD COLUMN "meetingCode" varchar(64);--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "meetingHostUserId" uuid;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_meetingHostUserId_users_id_fk" FOREIGN KEY ("meetingHostUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sessions_meeting_code_idx" ON "sessions" USING btree ("meetingCode");