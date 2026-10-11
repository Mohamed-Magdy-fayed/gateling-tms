-- Data migration: cancelled and completed groups used to keep their future
-- sessions on the live-classes calendar, because regeneration ignored the
-- group's status. It now plans nothing for an ended group; this clears the
-- rows left behind by groups that ended before that fix.
--
-- Same bar regeneration applies: only future, still-scheduled sessions nobody
-- has started (no meeting code). Past, ongoing, completed, and individually
-- cancelled sessions are history and are left alone. Reactivating a group
-- regenerates its future sessions.
DELETE FROM "sessions" AS s
USING "groups" AS g
WHERE g."id" = s."groupId"
  AND g."organizationId" = s."organizationId"
  AND g."status" IN ('cancelled', 'completed')
  AND s."status" = 'scheduled'
  AND s."scheduledAt" > now()
  AND s."meetingCode" IS NULL;
