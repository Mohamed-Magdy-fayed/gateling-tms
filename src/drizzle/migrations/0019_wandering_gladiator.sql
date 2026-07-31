CREATE TABLE "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"authorUserId" uuid,
	"quote" varchar(1024) NOT NULL,
	"authorName" varchar(128) NOT NULL,
	"authorRole" varchar(128),
	"imageUrl" varchar(512),
	"isPublic" boolean DEFAULT false NOT NULL,
	"approvedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" varchar NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now(),
	"updatedBy" varchar
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "publicShowcaseConsentAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "testimonialPromptDismissedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_authorUserId_users_id_fk" FOREIGN KEY ("authorUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "testimonials_organization_id_unique" ON "testimonials" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "testimonials_approved_at_idx" ON "testimonials" USING btree ("approvedAt");