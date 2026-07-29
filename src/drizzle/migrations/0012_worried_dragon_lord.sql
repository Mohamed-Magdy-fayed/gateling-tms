CREATE TYPE "public"."zoom_client_status" AS ENUM('pending', 'active', 'error');--> statement-breakpoint
CREATE TABLE "zoom_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"name" varchar(256) NOT NULL,
	"status" "zoom_client_status" DEFAULT 'pending' NOT NULL,
	"zoomUserId" varchar(256),
	"zoomAccountId" varchar(256),
	"zoomEmail" varchar(256),
	"accessToken" varchar,
	"refreshToken" varchar,
	"accessTokenExpiresAt" timestamp with time zone,
	"lastError" varchar(512),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" varchar NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now(),
	"updatedBy" varchar,
	"deletedAt" timestamp with time zone,
	"deletedBy" varchar,
	CONSTRAINT "zoom_clients_organization_id_id_unique" UNIQUE("organizationId","id")
);
--> statement-breakpoint
ALTER TABLE "zoom_clients" ADD CONSTRAINT "zoom_clients_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "zoom_clients_organization_id_idx" ON "zoom_clients" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "zoom_clients_status_idx" ON "zoom_clients" USING btree ("status");