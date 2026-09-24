CREATE TABLE "organization_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"code" varchar(128) NOT NULL,
	"value" jsonb NOT NULL,
	"createdBy" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedBy" varchar,
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_settings_organization_id_code_unique" ON "organization_settings" USING btree ("organizationId","code");