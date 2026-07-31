CREATE TYPE "public"."meeting_account_status" AS ENUM('active', 'error');--> statement-breakpoint
CREATE TABLE "meeting_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"name" varchar(256) NOT NULL,
	"status" "meeting_account_status" DEFAULT 'active' NOT NULL,
	"accountId" varchar(256) NOT NULL,
	"roomCode" varchar(256) NOT NULL,
	"roomName" varchar(256) NOT NULL,
	"apiKey" varchar,
	"apiSecret" varchar,
	"lastError" varchar(512),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" varchar NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now(),
	"updatedBy" varchar,
	"deletedAt" timestamp with time zone,
	"deletedBy" varchar,
	CONSTRAINT "meeting_accounts_organization_id_id_unique" UNIQUE("organizationId","id")
);
--> statement-breakpoint
ALTER TABLE "meeting_accounts" ADD CONSTRAINT "meeting_accounts_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meeting_accounts_organization_id_idx" ON "meeting_accounts" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "meeting_accounts_status_idx" ON "meeting_accounts" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "meeting_accounts_organization_id_room_code_unique" ON "meeting_accounts" USING btree ("organizationId","roomCode") WHERE "meeting_accounts"."deletedAt" is null;