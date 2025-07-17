CREATE TABLE "levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" text NOT NULL,
	"updatedBy" text,
	"name" varchar(256) NOT NULL,
	"courseId" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "createdBy" text NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "updatedBy" text;--> statement-breakpoint
ALTER TABLE "levels" ADD CONSTRAINT "levels_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;