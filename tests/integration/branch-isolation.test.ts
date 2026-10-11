import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { db } from "@/drizzle";
import {
  BranchesTable,
  OrganizationMembershipBranchesTable,
} from "@/drizzle/schema";
import {
  callerFor,
  createMember,
  createTenant,
  destroyMember,
  destroyTenant,
  type TenantFixture,
} from "./lib/harness";

/**
 * Branch scoping inside one academy (docs/designs/academy-branches.md): the
 * academy filter keeps tenants apart, this keeps branches apart. One academy,
 * two branches, one student in each; every assertion is about what a caller
 * with a given selection can read or change.
 */
let tenant: TenantFixture;
let nasrId: string;
let maadiId: string;
let nasrStudent: string;
let maadiStudent: string;
let teacherId: string;

const listIds = async (caller: TenantFixture["caller"]) => {
  const result = await caller.trainees.list({ page: 1, perPage: 100 });
  return result.rows.map((row) => row.id).sort();
};

beforeAll(async () => {
  tenant = await createTenant("BRISO", "Branch Isolation Academy");
  nasrId = tenant.branchId;
  const [maadi] = await db
    .insert(BranchesTable)
    .values({ organizationId: tenant.organizationId, name: "Maadi" })
    .returning({ id: BranchesTable.id });
  maadiId = maadi.id;

  const admin = (branchId: string | null) =>
    callerFor(tenant.userId, tenant.organizationId, branchId);
  nasrStudent = (await admin(nasrId).trainees.create({ name: "Nasr Student" }))
    .id;
  maadiStudent = (
    await admin(maadiId).trainees.create({ name: "Maadi Student" })
  ).id;

  const teacher = await createMember(tenant, "teacher");
  teacherId = teacher.userId;
  await db.insert(OrganizationMembershipBranchesTable).values({
    organizationId: tenant.organizationId,
    userId: teacherId,
    branchId: nasrId,
  });
});

afterAll(async () => {
  await destroyMember(teacherId);
  await destroyTenant(tenant);
});

describe("branch isolation", () => {
  test("an admin on All branches sees both branches", async () => {
    const ids = await listIds(
      callerFor(tenant.userId, tenant.organizationId, null),
    );
    expect(ids).toEqual([nasrStudent, maadiStudent].sort());
  });

  test("an admin with one branch selected sees only that branch", async () => {
    const ids = await listIds(
      callerFor(tenant.userId, tenant.organizationId, maadiId),
    );
    expect(ids).toEqual([maadiStudent]);
  });

  test("a teacher assigned to one branch never sees the other, even on All", async () => {
    expect(
      await listIds(callerFor(teacherId, tenant.organizationId, null)),
    ).toEqual([nasrStudent]);
    // Selecting a branch they aren't assigned to falls back to their own.
    expect(
      await listIds(callerFor(teacherId, tenant.organizationId, maadiId)),
    ).toEqual([nasrStudent]);
  });

  test("a row in another branch can't be read or changed", async () => {
    const nasrAdmin = callerFor(tenant.userId, tenant.organizationId, nasrId);
    await expect(
      nasrAdmin.trainees.get({ id: maadiStudent }),
    ).rejects.toThrow();
    await expect(
      nasrAdmin.trainees.update({ id: maadiStudent, name: "Hijacked" }),
    ).rejects.toThrow();
    await expect(
      nasrAdmin.trainees.delete({ id: maadiStudent }),
    ).rejects.toThrow();
  });

  test("creating on All branches needs an explicit branch", async () => {
    const all = callerFor(tenant.userId, tenant.organizationId, null);
    await expect(all.trainees.create({ name: "Nowhere" })).rejects.toThrow(
      /branch/i,
    );
    const created = await all.trainees.create({
      name: "Placed",
      branchId: maadiId,
    });
    const maadiIds = await listIds(
      callerFor(tenant.userId, tenant.organizationId, maadiId),
    );
    expect(maadiIds).toContain(created.id);
  });

  test("a teacher can't create into a branch they aren't assigned to", async () => {
    const teacher = callerFor(teacherId, tenant.organizationId, null);
    await expect(
      teacher.trainees.create({ name: "Smuggled", branchId: maadiId }),
    ).rejects.toThrow(/branch/i);
  });
  test("the list Branch filter narrows but never widens", async () => {
    const all = callerFor(tenant.userId, tenant.organizationId, null);
    const filtered = await all.trainees.list({
      page: 1,
      perPage: 100,
      branchIds: [maadiId],
    });
    // Earlier tests add more Maadi students; what matters is that only Maadi
    // comes back.
    expect(filtered.rows.map((row) => row.id)).toContain(maadiStudent);
    expect(filtered.rows.every((row) => row.branchId === maadiId)).toBe(true);

    // A teacher assigned to Nasr City asking for Maadi gets nothing, not Maadi.
    const teacher = callerFor(teacherId, tenant.organizationId, null);
    const smuggled = await teacher.trainees.list({
      page: 1,
      perPage: 100,
      branchIds: [maadiId],
    });
    expect(smuggled.rows).toEqual([]);
  });

  test("the dashboard splits by branch only on All branches", async () => {
    const all = await callerFor(
      tenant.userId,
      tenant.organizationId,
      null,
    ).dashboard.overview();
    expect(all.branches?.map((b) => b.id).sort()).toEqual(
      [nasrId, maadiId].sort(),
    );

    const one = await callerFor(
      tenant.userId,
      tenant.organizationId,
      maadiId,
    ).dashboard.overview();
    expect(one.branches).toBeNull();
  });
});
