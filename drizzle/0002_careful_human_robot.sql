CREATE TABLE "materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" text NOT NULL,
	"updatedBy" text,
	"order" serial NOT NULL,
	"title" varchar(256) NOT NULL,
	"subtitle" varchar(256),
	"uploads" varchar[] DEFAULT '{}' NOT NULL,
	"levelId" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_levelId_levels_id_fk" FOREIGN KEY ("levelId") REFERENCES "public"."levels"("id") ON DELETE no action ON UPDATE no action;