ALTER TABLE "sessions" DROP CONSTRAINT "sessions_organization_zoom_client_fk";
--> statement-breakpoint
DROP INDEX "sessions_zoom_client_id_idx";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "zoomClientId";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "zoomMeetingId";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "zoomMeetingPassword";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "zoomJoinUrl";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "zoomStartUrl";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "zoomRecordingUrl";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "zoomRecordingPassword";