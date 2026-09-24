import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { db } from "@/drizzle";
import { OrganizationsTable } from "@/drizzle/schema";
import {
  createMember,
  createTenant,
  destroyMember,
  destroyTenant,
  errorCodeOf,
  flagPlatformOwner,
  type TenantFixture,
} from "./lib/harness";

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

  afterAll(async () => {
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
});
