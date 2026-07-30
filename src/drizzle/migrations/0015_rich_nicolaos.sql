CREATE TYPE "public"."google_integration_status" AS ENUM('active', 'error');--> statement-breakpoint
ALTER TABLE "google_integrations" ADD COLUMN "status" "google_integration_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "google_integrations" ADD COLUMN "googleEmail" varchar(256);--> statement-breakpoint
ALTER TABLE "google_integrations" ADD COLUMN "googleUserId" varchar(256);--> statement-breakpoint
ALTER TABLE "google_integrations" ADD COLUMN "lastError" varchar(512);--> statement-breakpoint
ALTER TABLE "google_integrations" ADD COLUMN "createdBy" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "google_integrations" ADD COLUMN "updatedBy" varchar;--> statement-breakpoint
ALTER TABLE "user_oauth_accounts" DROP COLUMN "accessToken";--> statement-breakpoint
ALTER TABLE "user_oauth_accounts" DROP COLUMN "refreshToken";--> statement-breakpoint
ALTER TABLE "user_oauth_accounts" DROP COLUMN "scopes";--> statement-breakpoint
ALTER TABLE "user_oauth_accounts" DROP COLUMN "expiresAt";