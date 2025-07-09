ALTER TABLE "users" ADD COLUMN "has_web_authn" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "web_authn_enabled_at" timestamp;