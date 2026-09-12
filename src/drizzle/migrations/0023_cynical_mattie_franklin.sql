CREATE TYPE "public"."settings_label" AS ENUM('policy', 'integration');--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(128) NOT NULL,
	"label" "settings_label" NOT NULL,
	"description" text,
	"isActive" boolean,
	"value" text,
	"amount" integer,
	"createdBy" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedBy" varchar,
	"updatedAt" timestamp with time zone DEFAULT now(),
	CONSTRAINT "settings_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE INDEX "settings_code_idx" ON "settings" USING btree ("code");