ALTER TABLE "biometric_credentials" DROP CONSTRAINT "biometric_credentials_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "biometric_credentials" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "organization_memberships" ALTER COLUMN "isCurrent" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "organization_memberships" ALTER COLUMN "isCurrent" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_memberships" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "storageBytes" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_credentials" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_oauth_accounts" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "biometric_credentials" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "age";