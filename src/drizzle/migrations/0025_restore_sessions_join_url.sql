-- Custom convergence migration: production's sessions table never carried the
-- columns 0018 added. The 0021 deploy logged "column ... does not exist,
-- skipping" for every one it dropped ("meetingAccountId", "meetingNumber",
-- "startUrl"), which means the fourth column from that same migration,
-- "joinUrl", is missing too — and it is the only one the schema still uses.
-- Every session insert since (groups.create → regenerateGroupSessions) has
-- failed with 42703 undefined_column. IF NOT EXISTS so dev and preview, where
-- 0018 applied normally, are no-ops.
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "joinUrl" varchar(1024);
