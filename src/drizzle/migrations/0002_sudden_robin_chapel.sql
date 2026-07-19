ALTER TABLE "biometric_credentials" ADD COLUMN "userId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "dateOfBirth" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "biometric_credentials" ADD CONSTRAINT "biometric_credentials_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;