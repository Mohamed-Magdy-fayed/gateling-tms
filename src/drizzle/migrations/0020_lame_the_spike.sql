CREATE TYPE "public"."form_block_kind" AS ENUM('text', 'image', 'video');--> statement-breakpoint
ALTER TYPE "public"."question_type" ADD VALUE 'long_answer';--> statement-breakpoint
ALTER TYPE "public"."question_type" ADD VALUE 'date';--> statement-breakpoint
ALTER TYPE "public"."question_type" ADD VALUE 'time';--> statement-breakpoint
CREATE TABLE "form_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"sectionId" uuid NOT NULL,
	"kind" "form_block_kind" DEFAULT 'text' NOT NULL,
	"title" varchar(256),
	"body" text,
	"mediaUrl" text,
	"mediaAlt" varchar(256),
	"sourceUrl" text,
	"order" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now(),
	CONSTRAINT "form_blocks_organization_id_id_unique" UNIQUE("organizationId","id")
);
--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "isRequired" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "imageUrl" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "imageAlt" varchar(256);--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "imageSourceUrl" text;--> statement-breakpoint
ALTER TABLE "form_blocks" ADD CONSTRAINT "form_blocks_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_blocks" ADD CONSTRAINT "form_blocks_organization_section_fk" FOREIGN KEY ("organizationId","sectionId") REFERENCES "public"."form_sections"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "form_blocks_organization_id_idx" ON "form_blocks" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "form_blocks_section_id_idx" ON "form_blocks" USING btree ("sectionId");