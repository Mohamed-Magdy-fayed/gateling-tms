import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  callerFor,
  createMember,
  createTenant,
  destroyMember,
  destroyTenant,
  errorCodeOf,
  type TenantFixture,
} from "./lib/harness";

/**
 * Settings → Branches and member branch assignment
 * (docs/designs/academy-branches.md): what admins can change, what they
 * can't, and what the switcher is told as a result.
 */
let tenant: TenantFixture;
let other: TenantFixture;
let teacherId: string;

const admin = (branchId: string | null = null) =>
  callerFor(tenant.userId, tenant.organizationId, branchId);

beforeAll(async () => {
  tenant = await createTenant("BRADM", "Branch Admin Academy");
  other = await createTenant("BROTH", "Other Academy");
  teacherId = (await createMember(tenant, "teacher")).userId;
});

afterAll(async () => {
  await destroyMember(teacherId);
  await destroyTenant(tenant);
  await destroyTenant(other);
});

describe("branch administration", () => {
  test("an admin adds a branch; a duplicate name is refused", async () => {
    await admin().organizations.branches.create({ name: "Maadi" });
    const names = (await admin().organizations.branches.list()).map(
      (b) => b.name,
    );
    expect(names).toContain("Maadi");

    expect(
      await errorCodeOf(
        admin().organizations.branches.create({ name: "Maadi" }),
      ),
    ).toBe("CONFLICT");
  });

  test("a teacher can't add or edit branches", async () => {
    const teacher = callerFor(teacherId, tenant.organizationId, null);
    expect(
      await errorCodeOf(
        teacher.organizations.branches.create({ name: "Rogue" }),
      ),
    ).toBe("FORBIDDEN");
  });

  test("the last active branch can't be deactivated", async () => {
    const branches = await admin().organizations.branches.list();
    const [first, second] = branches;
    await admin().organizations.branches.update({
      branchId: second.id,
      name: second.name,
      isActive: false,
    });
    expect(
      await errorCodeOf(
        admin().organizations.branches.update({
          branchId: first.id,
          name: first.name,
          isActive: false,
        }),
      ),
    ).toBe("BAD_REQUEST");
    await admin().organizations.branches.update({
      branchId: second.id,
      name: second.name,
      isActive: true,
    });
  });

  test("another academy's branch can't be edited", async () => {
    expect(
      await errorCodeOf(
        admin().organizations.branches.update({
          branchId: other.branchId,
          name: "Hijacked",
          isActive: true,
        }),
      ),
    ).toBe("NOT_FOUND");
  });
});

describe("member branch assignment", () => {
  test("assigning narrows the teacher's switcher; clearing restores every branch", async () => {
    const branches = await admin().organizations.branches.list();
    const teacher = callerFor(teacherId, tenant.organizationId, null);

    await admin().organizations.members.setBranches({
      userId: teacherId,
      branchIds: [branches[0].id],
    });
    const [assigned] = await teacher.organizations.listMine();
    expect(assigned.branches.map((b) => b.id)).toEqual([branches[0].id]);
    expect(assigned.canSelectAll).toBe(false);
    expect(assigned.activeBranchId).toBe(branches[0].id);

    const members = await admin().organizations.members.listAll();
    expect(members.find((m) => m.userId === teacherId)?.branchIds).toEqual([
      branches[0].id,
    ]);

    await admin().organizations.members.setBranches({
      userId: teacherId,
      branchIds: [],
    });
    const [cleared] = await teacher.organizations.listMine();
    expect(cleared.branches).toHaveLength(branches.length);
    expect(cleared.canSelectAll).toBe(true);
  });

  test("a branch from another academy can't be assigned", async () => {
    expect(
      await errorCodeOf(
        admin().organizations.members.setBranches({
          userId: teacherId,
          branchIds: [other.branchId],
        }),
      ),
    ).toBe("BAD_REQUEST");
  });
});
