import { beforeEach, describe, expect, test, vi } from "vitest";

/**
 * The db singleton opens a postgres connection at import time and reads
 * DATABASE_URL. Nothing here touches a database — `ctx.db` is a stub and the
 * regeneration itself is mocked — so the module is stubbed rather than
 * configured. `on-group-schedule-changed` pulls it in transitively, just to
 * define the event these mutations send.
 */
vi.mock("@/drizzle", () => ({ db: {} }));

const send = vi.fn();
// `createFunction` is here because importing the mutations reaches the event
// definition through the function module that also registers the handler.
vi.mock("@/integrations/inngest/client", () => ({
  inngest: { send, createFunction: vi.fn() },
}));

const regenerateGroupSessions = vi.fn();
vi.mock(
  "@/features/system/learning-flow/groups/server/regenerate-sessions",
  () => ({ regenerateGroupSessions }),
);

const {
  createGroup,
  updateGroup,
} = await import(
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
  regenerateGroupSessions.mockReset();
  regenerateGroupSessions.mockResolvedValue({ removed: 0, written: 12 });
});

/**
 * The failure this guards against is the one that shipped: the enqueue was
 * fire-and-forget, so a queue the deployment couldn't reach left every new
 * group with a schedule and no sessions, and nothing ever retried.
 */
describe("session generation is not left to the queue alone", () => {
  test("a reachable queue is used, and nothing runs inline", async () => {
    send.mockResolvedValue(undefined);

    const result = await createGroup(stubContext(), input);

    expect(result.sessions).toBe("queued");
    expect(regenerateGroupSessions).not.toHaveBeenCalled();
  });

  test("creating a group generates inline when the enqueue fails", async () => {
    send.mockRejectedValue(new Error("connect ECONNREFUSED 127.0.0.1:8288"));

    const result = await createGroup(stubContext(), input);

    expect(result.sessions).toBe("inline");
    expect(regenerateGroupSessions).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: ORGANIZATION_ID,
        groupId: GROUP_ID,
      }),
    );
  });

  test("a queue that hangs until it times out also falls back", async () => {
    // The client bounds every request with an AbortSignal (CodeRabbit's round
    // on PR #60): without it an unresponsive host holds the mutation open
    // until the platform kills it, and a fallback that only runs after the
    // request has been killed is not a fallback.
    send.mockRejectedValue(
      Object.assign(new Error("The operation was aborted due to timeout"), {
        name: "TimeoutError",
      }),
    );

    const result = await createGroup(stubContext(), input);

    expect(result.sessions).toBe("inline");
    expect(regenerateGroupSessions).toHaveBeenCalledOnce();
  });

  test("editing a schedule generates inline when the enqueue fails", async () => {
    send.mockRejectedValue(new Error("connect ECONNREFUSED 127.0.0.1:8288"));

    const result = await updateGroup(stubContext(), { ...input, id: GROUP_ID });

    expect(result.sessions).toBe("inline");
    expect(regenerateGroupSessions).toHaveBeenCalledOnce();
  });

  test("only a dead queue *and* a failed inline run report failure", async () => {
    send.mockRejectedValue(new Error("queue unreachable"));
    regenerateGroupSessions.mockRejectedValue(new Error("database unreachable"));

    const result = await createGroup(stubContext(), input);

    // The group itself was written, so this stays a warning the client can
    // surface rather than an error that hides what did succeed.
    expect(result.id).toBe(GROUP_ID);
    expect(result.sessions).toBe("failed");
  });
});
