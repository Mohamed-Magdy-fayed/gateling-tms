CREATE TABLE "webauthn_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credential_id" varchar(256) NOT NULL,
	"public_key" varchar(2048) NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used" timestamp,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "webauthn_credentials_credential_id_unique" UNIQUE("credential_id")
);
