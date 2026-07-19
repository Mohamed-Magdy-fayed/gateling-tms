CREATE TYPE "public"."organization_membership_role" AS ENUM('admin', 'teacher', 'student');--> statement-breakpoint
CREATE TYPE "public"."organization_plan" AS ENUM('free', 'basic', 'professional', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."oauth_provider" AS ENUM('google');--> statement-breakpoint
CREATE TYPE "public"."user_token_type" AS ENUM('email_verification', 'password_reset', 'device_trust', 'otp', 'magic_link', 'org_invite');--> statement-breakpoint
CREATE TABLE "biometric_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"credentialId" text NOT NULL,
	"publicKey" text NOT NULL,
	"label" text,
	"transports" jsonb,
	"signCount" bigint DEFAULT 0 NOT NULL,
	"aaguid" text,
	"isBackupEligible" boolean DEFAULT false NOT NULL,
	"isBackupState" boolean DEFAULT false NOT NULL,
	"isUserVerified" boolean DEFAULT false NOT NULL,
	"lastUsedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "organization_memberships" (
	"isCurrent" boolean,
	"organizationId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"role" "organization_membership_role" DEFAULT 'student' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone,
	CONSTRAINT "organization_memberships_organizationId_userId_pk" PRIMARY KEY("organizationId","userId")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shortCode" varchar(8) NOT NULL,
	"name" varchar(128) NOT NULL,
	"businessName" varchar(256),
	"phone" varchar(32),
	"website" varchar(2048),
	"plan" "organization_plan" DEFAULT 'free' NOT NULL,
	"studentCount" integer DEFAULT 0 NOT NULL,
	"courseCount" integer DEFAULT 0 NOT NULL,
	"storageBytes" integer DEFAULT 0 NOT NULL,
	"ownerId" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_credentials" (
	"userId" uuid NOT NULL,
	"passwordHash" text NOT NULL,
	"passwordSalt" text NOT NULL,
	"expiresAt" timestamp with time zone,
	"mustChangePassword" boolean DEFAULT false NOT NULL,
	"lastChangedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_oauth_accounts" (
	"userId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone,
	"provider" "oauth_provider" NOT NULL,
	"providerAccountId" text NOT NULL,
	"displayName" text,
	"profileUrl" text,
	"accessToken" text,
	"refreshToken" text,
	"scopes" jsonb,
	"expiresAt" timestamp with time zone,
	CONSTRAINT "user_oauth_accounts_providerAccountId_provider_pk" PRIMARY KEY("providerAccountId","provider")
);
--> statement-breakpoint
CREATE TABLE "user_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"tokenHash" text NOT NULL,
	"type" "user_token_type" NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"consumedAt" timestamp with time zone,
	"metadata" jsonb DEFAULT 'null'::jsonb,
	CONSTRAINT "user_tokens_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(256) NOT NULL,
	"name" varchar(256),
	"phone" varchar(16),
	"imageUrl" varchar(512),
	"parentId" uuid,
	"emailVerifiedAt" timestamp with time zone,
	"lastSignInAt" timestamp with time zone,
	"age" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" varchar NOT NULL,
	"updatedAt" timestamp with time zone,
	"updatedBy" varchar,
	"deletedAt" timestamp with time zone,
	"deletedBy" varchar
);
--> statement-breakpoint
ALTER TABLE "biometric_credentials" ADD CONSTRAINT "biometric_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_oauth_accounts" ADD CONSTRAINT "user_oauth_accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tokens" ADD CONSTRAINT "user_tokens_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_parentId_users_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_short_code_idx" ON "organizations" USING btree ("shortCode");--> statement-breakpoint
CREATE UNIQUE INDEX "user_credentials_user_id_unique" ON "user_credentials" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "user_oauth_accounts_user_provider_unique" ON "user_oauth_accounts" USING btree ("userId","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_unique" ON "users" USING btree ("phone");