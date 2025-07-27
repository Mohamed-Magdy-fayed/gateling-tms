CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" text NOT NULL,
	"updatedBy" text,
	"deletedBy" text,
	"deletedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"fileName" varchar(256) NOT NULL,
	"path" varchar(256) NOT NULL,
	"size" integer NOT NULL,
	"type" varchar(64) NOT NULL,
	"materialId" uuid NOT NULL,
	CONSTRAINT "files_path_unique" UNIQUE("path")
);
--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_materialId_materials_id_fk" FOREIGN KEY ("materialId") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "path_idx" ON "files" USING btree ("path");