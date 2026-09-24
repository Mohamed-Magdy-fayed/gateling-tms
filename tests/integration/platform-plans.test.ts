import { eq } from "drizzle-orm";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { db } from "@/drizzle";
import { OrganizationsTable } from "@/drizzle/schema";
import { inngest } from "@/integrations/inngest/client";
import { handleOrganizationPlanGranted } from "@/integrations/inngest/functions/on-organization-plan-granted";
import {
  createMember,
  createTenant,
  destroyMember,
  destroyTenant,
  errorCodeOf,
  flagPlatformOwner,
  type TenantFixture,
} from "./lib/harness";

// The grant email job's only way out; nothing else in this file sends mail.
const { sendMail } = vi.hoisted(() => ({ sendMail: vi.fn() }));
vi.mock("@/integrations/email", () => ({ sendMail }));

/**
 * The platform owner's plan grant (design doc `academy-preferences.md` R8)
 * and the Academies list behind it (DT4). These are the only routes that take
 * another organization's id, so the gate is the whole point: only a user
 * flagged `isPlatformOwner` gets through, whatever their role in any academy.
 */

async function planOf(organizationId: string) {
  const [row] = await db
    .select({
      plan: OrganizationsTable.plan,
      planGrantedBy: OrganizationsTable.planGrantedBy,
      planGrantedAt: OrganizationsTable.planGrantedAt,
    })
    .from(OrganizationsTable)
    .where(eq(OrganizationsTable.id, organizationId));
  return row;
}

async function setStudentCount(organizationId: string, studentCount: number) {
  await db
    .update(OrganizationsTable)
    .set({ studentCount })
    .where(eq(OrganizationsTable.id, organizationId));
}

describe("platform plan grants", () => {
  const suffix = Date.now().toString().slice(-5);
  let owner: TenantFixture;
  let academy: TenantFixture;
  let otherAdmin: Awaited<ReturnType<typeof createMember>>;

  beforeAll(async () => {
    owner = await createTenant(`PO${suffix}`, "Platform Owner Academy");
    await flagPlatformOwner(owner.userId);
    academy = await createTenant(`PA${suffix}`, "Granted Academy");
    // An admin of the academy being granted, and of nothing else.
    otherAdmin = await createMember(academy, "admin");
  });

  // Every grant enqueues the admin email; no test here talks to Inngest.
  const send = vi.spyOn(inngest, "send").mockResolvedValue({ ids: ["test"] });

  afterEach(() => {
    send.mockClear();
    sendMail.mockReset();
  });

  afterAll(async () => {
    send.mockRestore();
    await destroyMember(otherAdmin.userId);
    await destroyTenant(academy);
    await destroyTenant(owner);
  });

  describe("gate", () => {
    test.each([
      ["the academy's own admin", () => academy.caller],
      ["another admin of that academy", () => otherAdmin.caller],
    ])("%s can neither list nor grant", async (_who, callerOf) => {
      expect(await errorCodeOf(callerOf().platform.listOrganizations({}))).toBe(
        "FORBIDDEN",
      );
      expect(
        await errorCodeOf(
          callerOf().platform.setOrganizationPlan({
            organizationId: academy.organizationId,
            plan: "enterprise",
          }),
        ),
      ).toBe("FORBIDDEN");
      expect((await planOf(academy.organizationId)).plan).toBe("free");
    });
  });

  describe("listOrganizations", () => {
    test("finds any academy by name, with its owner email and usage", async () => {
      const result = await owner.caller.platform.listOrganizations({
        globalFilter: "Granted Academy",
      });
      const row = result.rows.find((r) => r.id === academy.organizationId);

      expect(row).toMatchObject({
        name: "Granted Academy",
        shortCode: `PA${suffix}`,
        plan: "free",
        adminEmail: academy.email,
        planGrantedBy: null,
        isMine: false,
      });
    });

    test("finds an academy by its owner's email", async () => {
      const result = await owner.caller.platform.listOrganizations({
        globalFilter: academy.email,
      });

      expect(result.rows.map((r) => r.id)).toEqual([academy.organizationId]);
    });

    test("tags the owner's own academy as theirs", async () => {
      const result = await owner.caller.platform.listOrganizations({
        globalFilter: `PO${suffix}`,
      });

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        id: owner.organizationId,
        isMine: true,
      });
    });

    test("pages newest first", async () => {
      const result = await owner.caller.platform.listOrganizations({
        perPage: 1,
        globalFilter: suffix,
      });

      expect(result.total).toBe(2);
      expect(result.pageCount).toBe(2);
      // `academy` was created after `owner`'s academy.
      expect(result.rows[0].id).toBe(academy.organizationId);
    });
  });

  describe("setOrganizationPlan", () => {
    test("a granted plan lifts the student limit: the 51st student fits", async () => {
      await setStudentCount(academy.organizationId, 50);

      expect(
        await errorCodeOf(
          academy.caller.trainees.create({ name: "Student 51" }),
        ),
      ).toBe("FORBIDDEN");

      const result = await owner.caller.platform.setOrganizationPlan({
        organizationId: academy.organizationId,
        plan: "basic",
      });
      expect(result).toEqual({
        organizationId: academy.organizationId,
        plan: "basic",
        changed: true,
      });

      const stored = await planOf(academy.organizationId);
      expect(stored.plan).toBe("basic");
      expect(stored.planGrantedBy).toBe(`${owner.userId}@integration.test`);
      expect(stored.planGrantedAt).toBeInstanceOf(Date);

      expect(
        await errorCodeOf(
          academy.caller.trainees.create({ name: "Student 51" }),
        ),
      ).toBeNull();
    });

    test("saving the current plan changes nothing, audit included", async () => {
      const before = await planOf(academy.organizationId);

      const result = await owner.caller.platform.setOrganizationPlan({
        organizationId: academy.organizationId,
        plan: before.plan,
      });

      expect(result.changed).toBe(false);
      expect(await planOf(academy.organizationId)).toEqual(before);
      expect(send).not.toHaveBeenCalled();
    });

    test("a real change enqueues one plan-granted event, keyed to the grant", async () => {
      await owner.caller.platform.setOrganizationPlan({
        organizationId: academy.organizationId,
        plan: "professional",
      });

      const { planGrantedAt } = await planOf(academy.organizationId);
      const grantedAt = planGrantedAt?.toISOString();
      expect(send).toHaveBeenCalledTimes(1);
      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({
          id: `plan-granted:${academy.organizationId}:${grantedAt}`,
          name: "organization/plan-granted",
          data: {
            organizationId: academy.organizationId,
            plan: "professional",
            grantedAt,
            locale: "en",
          },
        }),
      );
    });

    test("a failed enqueue still keeps the grant", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      send.mockRejectedValueOnce(new Error("Inngest unreachable"));

      const result = await owner.caller.platform.setOrganizationPlan({
        organizationId: academy.organizationId,
        plan: "enterprise",
      });

      expect(result.changed).toBe(true);
      expect((await planOf(academy.organizationId)).plan).toBe("enterprise");
      expect(error).toHaveBeenCalled();
      error.mockRestore();
    });

    // Downgrades are allowed and touch no data: the academy keeps what it
    // has, above the limit, and simply can't add more.
    test("a downgrade below current usage is allowed and blocks new students", async () => {
      await setStudentCount(academy.organizationId, 80);

      await owner.caller.platform.setOrganizationPlan({
        organizationId: academy.organizationId,
        plan: "free",
      });

      expect((await planOf(academy.organizationId)).plan).toBe("free");
      expect(
        await errorCodeOf(
          academy.caller.trainees.create({ name: "Over the limit" }),
        ),
      ).toBe("FORBIDDEN");
    });

    test("an unknown academy is NOT_FOUND", async () => {
      expect(
        await errorCodeOf(
          owner.caller.platform.setOrganizationPlan({
            organizationId: "00000000-0000-4000-8000-000000000000",
            plan: "basic",
          }),
        ),
      ).toBe("NOT_FOUND");
    });
  });

  describe("plan-granted email job", () => {
    /**
     * A step that memoizes by id across runs, the way Inngest replays a
     * retried run: a step that already succeeded returns its stored result
     * instead of running again.
     */
    function memoizingStep() {
      const done = new Map<string, unknown>();
      return {
        run: async <T>(id: string, fn: () => Promise<T>) => {
          if (done.has(id)) return done.get(id);
          const result = await fn();
          done.set(id, result);
          return result;
        },
      };
    }

    const event = () => ({
      data: {
        organizationId: academy.organizationId,
        plan: "basic" as const,
        grantedAt: "2026-09-24T10:00:00.000Z",
        locale: "ar",
      },
    });

    test("emails every admin of the academy, and only its admins", async () => {
      const teacher = await createMember(academy, "teacher");
      try {
        const result = await handleOrganizationPlanGranted({
          event: event(),
          step: memoizingStep(),
        });

        expect(result).toEqual({ sent: 2 });
        const recipients = sendMail.mock.calls.map(([mail]) => mail.toEmail);
        expect(recipients).toHaveLength(2);
        expect(recipients).toContain(academy.email);
        expect(recipients).not.toContain(`${owner.userId}@integration.test`);
        // In the granting owner's locale: Arabic subject, plan name included.
        expect(sendMail.mock.calls[0][0].subject).toBe(
          "خطتك في Gateling أصبحت الآن أساسي",
        );
      } finally {
        await destroyMember(teacher.userId);
      }
    });

    test("a retry after one failed send emails each admin once", async () => {
      const step = memoizingStep();
      sendMail.mockResolvedValueOnce(undefined);
      sendMail.mockRejectedValueOnce(new Error("SMTP down"));

      await expect(
        handleOrganizationPlanGranted({ event: event(), step }),
      ).rejects.toThrow("SMTP down");
      await handleOrganizationPlanGranted({ event: event(), step });

      const recipients = sendMail.mock.calls.map(([mail]) => mail.toEmail);
      // First admin once, second admin twice (the failed try + the retry).
      expect(recipients).toHaveLength(3);
      expect(new Set(recipients).size).toBe(2);
      expect(recipients.filter((r) => r === recipients[0])).toHaveLength(1);
    });
  });
});
