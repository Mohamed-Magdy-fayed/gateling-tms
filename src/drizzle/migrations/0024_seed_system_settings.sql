-- Custom data migration: the deployment-wide settings rows the Gateling
-- Meetings integration reads (features/system/settings/lib/system-settings-registry.ts).
-- Values start unset except the API URL; an admin fills the key and secret in
-- on /settings. Idempotent on the unique `code`, so re-running never touches a
-- value someone has already set.
INSERT INTO "settings" ("code", "label", "value", "isActive", "createdBy")
VALUES
	('00001', 'integration', 'https://meetings.gateling.com', true, 'migration'),
	('00002', 'integration', NULL, true, 'migration'),
	('00003', 'integration', NULL, true, 'migration')
ON CONFLICT ("code") DO NOTHING;
