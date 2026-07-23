CREATE INDEX "organization_memberships_user_id_idx" ON "organization_memberships" USING btree ("userId");--> statement-breakpoint
ALTER TABLE "organization_memberships" DROP COLUMN "isCurrent";