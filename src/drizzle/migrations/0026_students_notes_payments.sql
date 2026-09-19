CREATE TYPE "public"."payment_method" AS ENUM('cash', 'bankTransfer', 'instapay', 'wallet', 'card', 'other');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"traineeId" uuid NOT NULL,
	"enrollmentId" uuid,
	"amount" numeric(12, 2) NOT NULL,
	"paidAt" date NOT NULL,
	"method" "payment_method" DEFAULT 'cash' NOT NULL,
	"reference" varchar(128),
	"note" varchar(1024),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" varchar NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now(),
	"updatedBy" varchar,
	CONSTRAINT "payments_organization_id_id_unique" UNIQUE("organizationId","id")
);
--> statement-breakpoint
CREATE TABLE "trainee_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" uuid NOT NULL,
	"traineeId" uuid NOT NULL,
	"body" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" varchar NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now(),
	"updatedBy" varchar,
	CONSTRAINT "trainee_notes_organization_id_id_unique" UNIQUE("organizationId","id")
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "currency" varchar(3) DEFAULT 'EGP' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_enrollmentId_enrollments_id_fk" FOREIGN KEY ("enrollmentId") REFERENCES "public"."enrollments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_trainee_fk" FOREIGN KEY ("organizationId","traineeId") REFERENCES "public"."trainees"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainee_notes" ADD CONSTRAINT "trainee_notes_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainee_notes" ADD CONSTRAINT "trainee_notes_organization_trainee_fk" FOREIGN KEY ("organizationId","traineeId") REFERENCES "public"."trainees"("organizationId","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_organization_id_idx" ON "payments" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "payments_trainee_id_idx" ON "payments" USING btree ("traineeId");--> statement-breakpoint
CREATE INDEX "payments_enrollment_id_idx" ON "payments" USING btree ("enrollmentId");--> statement-breakpoint
CREATE INDEX "trainee_notes_organization_id_idx" ON "trainee_notes" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "trainee_notes_trainee_id_idx" ON "trainee_notes" USING btree ("traineeId");