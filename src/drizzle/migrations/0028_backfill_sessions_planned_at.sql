-- Data migration (hand-written on purpose, see the global migration rules):
-- every session that exists today was written by the weekly-schedule
-- generator, so the pattern occurrence it stands for *is* its scheduled
-- instant. Backfilling makes `plannedAt` the regeneration key for old and new
-- rows alike, so the first group save after this deploy neither deletes nor
-- duplicates anything. Affects data only; the column itself was added in
-- 0027.
UPDATE "sessions" SET "plannedAt" = "scheduledAt" WHERE "plannedAt" IS NULL;
