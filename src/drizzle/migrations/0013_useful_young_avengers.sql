ALTER TABLE "sessions" ADD COLUMN "zoomClientId" uuid;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "zoomMeetingId" varchar(64);--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "zoomMeetingPassword" varchar(64);--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "zoomJoinUrl" varchar(1024);--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "zoomStartUrl" varchar(2048);--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_organization_zoom_client_fk" FOREIGN KEY ("organizationId","zoomClientId") REFERENCES "public"."zoom_clients"("organizationId","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sessions_zoom_client_id_idx" ON "sessions" USING btree ("zoomClientId");