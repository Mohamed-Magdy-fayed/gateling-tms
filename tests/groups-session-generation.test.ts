import { beforeEach, describe, expect, test, vi } from "vitest";

/**
 * The db singleton opens a postgres connection at import time and reads
 * DATABASE_URL. Nothing here touches a database — `ctx.db` is a stub and the
 * generation itself is mocked — so the module is stubbed rather than
 * configured.
 */
vi.mock("@/drizzle", () => ({ db: {} }));

const send = vi.fn();
vi.mock("@/integrations/inngest/client", () => ({
  inngest: { send, createFunction: vi.fn() },
}));

const regenerateGroupSessions = vi.fn();
vi.mock(
  "@/features/system/learning-flow/groups/server/regenerate-sessions",
  () => ({ regenerateGroupSessions }),
);

const { createGroup, updateGroup } = await import(
  "../src/features/system/learning-flow/groups/server/mutations"
);

const GROUP_ID = "11111111-1111-4111-8111-111111111111";
const ORGANIZATION_ID = "22222222-2222-4222-8222-222222222222";

/**
 * Just enough of the org tRPC context for the two mutations under test: no
 * course or teacher is referenced, so the ownership checks short-circuit and
 * the only database calls are the insert and the update.
 */
function stubContext() {
  const returning = vi.fn().mockResolvedValue([{ id: GROUP_ID }]);

  return {
    organizationId: ORGANIZATION_ID,
    t: (key: string) => key,
    db: {
      insert: () => ({ values: () => ({ returning }) }),
      update: () => ({ set: () => ({ where: () => ({ returning }) }) }),
    },
    // biome-ignore lint/suspicious/noExplicitAny: a hand-built stub of the org context, narrowed to what these two mutations actually reach for
  } as any;
}

const input = {
  name: "Wednesday Intermediate",
  courseId: null,
  teacherId: null,
  status: "active" as const,
  startDate: "2026-09-01",
  sessionCount: 12,
  schedule: [{ day: 3, startTime: "18:00", endTime: "20:00" }],
};

beforeEach(() => {
  send.mockReset();
  send.mockResolvedValue(undefined);
  regenerateGroupSessions.mockReset();
  regenerateGroupSessions.mockResolvedValue({ removed: 0, written: 12 });
});

/**
 * The failure this guards against is the one that shipped *twice*.
 *
 * First the enqueue was fire-and-forget, so a queue the deployment couldn't
 * reach left every new group with a schedule and no sessions. Then the fix
 * fell back to inline generation only when `inngest.send` **threw** — which
 * misses the failure that actually happens (D178): an Inngest app that never
 * synced still *accepts* the event, so the send succeeds, nothing consumes it,
 * and the fallback never fires. Generation is inline and unconditional now.
 */
describe("session generation does not depend on the queue", () => {
  test("creating a group generates its sessions before returning", async () => {
    const result = await createGroup(stubContext(), input);

    expect(result.sessions).toBe("generated");
    expect(regenerateGroupSessions).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: ORGANIZATION_ID,
        groupId: GROUP_ID,
      }),
    );
  });

  test("editing a schedule regenerates before returning", async () => {
    const result = await updateGroup(stubContext(), { ...input, id: GROUP_ID });

    expect(result.sessions).toBe("generated");
    expect(regenerateGroupSessions).toHaveBeenCalledOnce();
  });

  test("generates even when the queue would have accepted the event", async () => {
    // This is the D178 shape precisely: the send succeeds, so the old code
    // reported "queued" and stopped. Nothing may depend on that success.
    send.mockResolvedValue({ ids: ["evt_1"] });

    const result = await createGroup(stubContext(), input);

    expect(result.sessions).toBe("generated");
    expect(regenerateGroupSessions).toHaveBeenCalledOnce();
  });

  test("does not enqueue an event on the save path at all", async () => {
    // The inline run is authoritative and idempotent, so an event here would
    // only buy a redundant run — and a round trip on every save.
    await createGroup(stubContext(), input);

    expect(send).not.toHaveBeenCalled();
  });

  test("a failed generation is reported, not swallowed", async () => {
    regenerateGroupSessions.mockRejectedValue(new Error("database unreachable"));

    const result = await createGroup(stubContext(), input);

    // The group itself was written, so this stays a warning the client can
    // surface rather than an error that hides what did succeed.
    expect(result.id).toBe(GROUP_ID);
    expect(result.sessions).toBe("failed");
  });
});
