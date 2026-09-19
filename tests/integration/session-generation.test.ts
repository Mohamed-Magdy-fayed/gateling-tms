import { and, asc, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { db } from "@/drizzle";
import { GroupsTable, SessionsTable } from "@/drizzle/schema";
import { regenerateGroupSessions } from "@/features/system/students/groups/server/regenerate-sessions";
import { createTenant, destroyTenant, type TenantFixture } from "./lib/harness";

/**
 * Session generation, exercised against a real database.
 *
 * The unit suite already covers `generateSessionOccurrences` — the pure
 * calendar walk. What was never covered, and what actually broke, is the
 * writing half: the delete/upsert transaction that turns those occurrences
 * into rows, and the rules about which existing rows it is allowed to touch.
 * The demo seed inserts sessions directly, so a seeded environment looks
 * correct whether or not this code works at all.
 */

const A_WEEK_MS = 7 * 86_400_000;

/** Sunday, so a schedule slot for any weekday lands within the first week. */
function isoDateWeeksFromNow(weeks: number): string {
  return new Date(Date.now() + weeks * A_WEEK_MS).toISOString().slice(0, 10);
}

async function createGroupWithSchedule(
  tenant: TenantFixture,
  values: Partial<typeof GroupsTable.$inferInsert> = {},
) {
  const [group] = await db
    .insert(GroupsTable)
    .values({
      organizationId: tenant.organizationId,
      name: "Generation Group",
      startDate: isoDateWeeksFromNow(1),
      sessionCount: 6,
      schedule: [{ day: 1, startTime: "18:00", endTime: "20:00" }],
      ...values,
    })
    .returning({ id: GroupsTable.id });

  return group.id;
}

function listSessions(organizationId: string, groupId: string) {
  return db
    .select({
      id: SessionsTable.id,
      scheduledAt: SessionsTable.scheduledAt,
      durationMinutes: SessionsTable.durationMinutes,
      status: SessionsTable.status,
    })
    .from(SessionsTable)
    .where(
      and(
        eq(SessionsTable.organizationId, organizationId),
        eq(SessionsTable.groupId, groupId),
      ),
    )
    .orderBy(asc(SessionsTable.scheduledAt));
}

describe("session generation", () => {
  let tenant: TenantFixture;

  beforeAll(async () => {
    tenant = await createTenant(
      `SG${Date.now().toString().slice(-6)}`,
      "Session Generation",
    );
  });

  afterAll(async () => {
    await destroyTenant(tenant);
  });

  test("expands a weekly schedule into dated sessions", async () => {
    const groupId = await createGroupWithSchedule(tenant);

    const result = await regenerateGroupSessions({
      db,
      organizationId: tenant.organizationId,
      groupId,
    });

    expect(result.written).toBe(6);
    const sessions = await listSessions(tenant.organizationId, groupId);
    expect(sessions).toHaveLength(6);
    // 18:00–20:00 in the org's zone, whatever that zone maps the hour to.
    expect(sessions.every((s) => s.durationMinutes === 120)).toBe(true);
  });

  test("running twice converges rather than duplicating", async () => {
    const groupId = await createGroupWithSchedule(tenant);
    const args = { db, organizationId: tenant.organizationId, groupId };

    await regenerateGroupSessions(args);
    const second = await regenerateGroupSessions(args);

    // The second run rewrites the same rows rather than adding to them — this
    // is what makes the inline fallback safe to run alongside a queued event
    // that turned out to have landed after all.
    expect(second.removed).toBe(0);
    expect(await listSessions(tenant.organizationId, groupId)).toHaveLength(6);
  });

  test("a shortened slot updates the surviving rows in place", async () => {
    const groupId = await createGroupWithSchedule(tenant);
    const args = { db, organizationId: tenant.organizationId, groupId };

    await regenerateGroupSessions(args);
    const before = await listSessions(tenant.organizationId, groupId);

    await db
      .update(GroupsTable)
      .set({ schedule: [{ day: 1, startTime: "18:00", endTime: "19:00" }] })
      .where(eq(GroupsTable.id, groupId));
    await regenerateGroupSessions(args);

    const after = await listSessions(tenant.organizationId, groupId);
    expect(after.every((s) => s.durationMinutes === 60)).toBe(true);
    // Same start instants, so the ids are stable across the edit — anything
    // already pointing at a session keeps pointing at it.
    expect(after.map((s) => s.id)).toEqual(before.map((s) => s.id));
  });

  test("dropping the schedule removes the future sessions", async () => {
    const groupId = await createGroupWithSchedule(tenant);
    const args = { db, organizationId: tenant.organizationId, groupId };

    await regenerateGroupSessions(args);
    await db
      .update(GroupsTable)
      .set({ schedule: [] })
      .where(eq(GroupsTable.id, groupId));

    const result = await regenerateGroupSessions(args);

    expect(result.removed).toBe(6);
    expect(await listSessions(tenant.organizationId, groupId)).toHaveLength(0);
  });

  test("leaves history and started classes alone", async () => {
    const groupId = await createGroupWithSchedule(tenant);

    // A class that already happened, and a future one somebody has started
    // early. Neither is part of the plan any more — the group's schedule
    // expands to different instants entirely — but a schedule edit must not
    // rewrite what happened or delete a class with a live meeting.
    const past = new Date(Date.now() - A_WEEK_MS);
    const claimed = new Date(Date.now() + 3 * A_WEEK_MS + 3_600_000);

    await db.insert(SessionsTable).values([
      {
        organizationId: tenant.organizationId,
        groupId,
        scheduledAt: past,
        durationMinutes: 90,
        status: "completed",
      },
      {
        organizationId: tenant.organizationId,
        groupId,
        scheduledAt: claimed,
        durationMinutes: 90,
        meetingCode: "gen-fixt-ure",
        joinUrl: "https://meetings.example.test/m/gen-fixt-ure",
      },
    ]);

    await regenerateGroupSessions({
      db,
      organizationId: tenant.organizationId,
      groupId,
    });

    const sessions = await listSessions(tenant.organizationId, groupId);
    const times = sessions.map((s) => s.scheduledAt.getTime());
    expect(times).toContain(past.getTime());
    expect(times).toContain(claimed.getTime());
    expect(
      sessions.find((s) => s.scheduledAt.getTime() === past.getTime()),
    ).toMatchObject({ durationMinutes: 90, status: "completed" });
  });

  test("a class moved on the calendar survives regeneration", async () => {
    const groupId = await createGroupWithSchedule(tenant);
    const args = { db, organizationId: tenant.organizationId, groupId };

    await regenerateGroupSessions(args);
    const [first] = await listSessions(tenant.organizationId, groupId);

    // What `sessions.update` writes: a new instant, the pattern occurrence
    // pinned, and the human's fingerprint.
    const movedTo = new Date(first.scheduledAt.getTime() + 86_400_000);
    await db
      .update(SessionsTable)
      .set({
        scheduledAt: movedTo,
        durationMinutes: 45,
        adjustedAt: new Date(),
      })
      .where(eq(SessionsTable.id, first.id));

    // A rename-style save: same schedule, regenerated anyway.
    const result = await regenerateGroupSessions(args);

    const after = await listSessions(tenant.organizationId, groupId);
    // Neither deleted nor duplicated — still six, the moved one where it was
    // put, and with the length the person gave it.
    expect(result.removed).toBe(0);
    expect(after).toHaveLength(6);
    expect(after.find((s) => s.id === first.id)).toMatchObject({
      scheduledAt: movedTo,
      durationMinutes: 45,
    });
    expect(
      after.filter(
        (s) => s.scheduledAt.getTime() === first.scheduledAt.getTime(),
      ),
    ).toHaveLength(0);
  });

  test("a hand-picked teacher on one class outlives a group teacher change", async () => {
    const groupId = await createGroupWithSchedule(tenant, {
      teacherId: tenant.userId,
    });
    const args = { db, organizationId: tenant.organizationId, groupId };

    await regenerateGroupSessions(args);
    const [substituted, ...others] = await listSessions(
      tenant.organizationId,
      groupId,
    );

    // A substitute on one class — the teacher column cleared here stands in
    // for "someone else", which the fixture has no second member for.
    await db
      .update(SessionsTable)
      .set({ teacherId: null, adjustedAt: new Date() })
      .where(eq(SessionsTable.id, substituted.id));

    await regenerateGroupSessions(args);

    const rows = await db
      .select({ id: SessionsTable.id, teacherId: SessionsTable.teacherId })
      .from(SessionsTable)
      .where(eq(SessionsTable.groupId, groupId));
    expect(rows.find((r) => r.id === substituted.id)?.teacherId).toBeNull();
    for (const other of others) {
      expect(rows.find((r) => r.id === other.id)?.teacherId).toBe(
        tenant.userId,
      );
    }
  });

  test("refuses to regenerate another organization's group", async () => {
    const other = await createTenant(
      `SGX${Date.now().toString().slice(-5)}`,
      "Session Generation Other",
    );

    try {
      const groupId = await createGroupWithSchedule(other);

      const result = await regenerateGroupSessions({
        db,
        organizationId: tenant.organizationId,
        groupId,
      });

      expect(result).toEqual({ removed: 0, written: 0 });
      expect(await listSessions(other.organizationId, groupId)).toHaveLength(0);
    } finally {
      await destroyTenant(other);
    }
  });
});
