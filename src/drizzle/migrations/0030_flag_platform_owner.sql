-- Data migration (hand-written on purpose, see the global migration rules):
-- flags the account of whoever runs this deployment as the platform owner,
-- which is what `platformOwnerProcedure` checks for the deployment-wide
-- settings (design doc academy-preferences.md, R1). There is no route that
-- writes this flag; changing the owner is another data migration.
-- Idempotent, and a no-op in an environment where the account doesn't exist.
UPDATE "users" SET "isPlatformOwner" = true WHERE lower("email") = lower('mohamed.ahmed.sc2@gmail.com');
