import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { db } from "@/drizzle";
import {
  BranchesTable,
  OrganizationMembershipBranchesTable,
  TraineesTable,
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

  test("the dashboard tiles follow the selected branch", async () => {
    const overview = (branchId: string | null) =>
      callerFor(
        tenant.userId,
        tenant.organizationId,
        branchId,
      ).dashboard.overview();
    const [all, nasr, maadi] = await Promise.all([
      overview(null),
      overview(nasrId),
      overview(maadiId),
    ]);

    // Earlier tests add students to Maadi, so compare against the lists.
    const count = async (branchId: string) =>
      (await listIds(callerFor(tenant.userId, tenant.organizationId, branchId)))
        .length;
    expect(nasr.counts.students).toBe(await count(nasrId));
    expect(maadi.counts.students).toBe(await count(maadiId));
    expect(all.counts.students).toBe(
      nasr.counts.students + maadi.counts.students,
    );

    // Plan limits are academy-wide; a single branch doesn't get them.
    expect(all.isNarrowed).toBe(false);
    expect(all.limits).not.toBeNull();
    expect(maadi.isNarrowed).toBe(true);
    expect(maadi.limits).toBeNull();

    // A teacher who only ever sees one branch is looking at all they have.
    const teacher = await callerFor(
      teacherId,
      tenant.organizationId,
      null,
    ).dashboard.overview();
    expect(teacher.isNarrowed).toBe(false);
    expect(teacher.counts.students).toBe(nasr.counts.students);
  });

  test("members follow the selected branch", async () => {
    const floater = await createMember(tenant, "teacher");
    const student = await createMember(tenant, "student");
    await db
      .update(TraineesTable)
      .set({ userId: student.userId })
      .where(eq(TraineesTable.id, maadiStudent));
    try {
      const members = async (branchId: string | null) =>
        (
          await callerFor(
            tenant.userId,
            tenant.organizationId,
            branchId,
          ).organizations.members.listAll()
        ).map((row) => row.userId);

      const [all, nasr, maadi] = await Promise.all([
        members(null),
        members(nasrId),
        members(maadiId),
      ]);
      // Admins and unassigned staff are in every branch.
      for (const list of [all, nasr, maadi]) {
        expect(list).toContain(tenant.userId);
        expect(list).toContain(floater.userId);
      }
      // A teacher assigned to Nasr City isn't a Maadi member.
      expect(all).toContain(teacherId);
      expect(nasr).toContain(teacherId);
      expect(maadi).not.toContain(teacherId);
      // A student follows their student record's branch.
      expect(all).toContain(student.userId);
      expect(maadi).toContain(student.userId);
      expect(nasr).not.toContain(student.userId);

      // The teacher pickers use the paged list, under the same rule.
      const maadiTeachers = await callerFor(
        tenant.userId,
        tenant.organizationId,
        maadiId,
      ).organizations.members.list({
        page: 1,
        perPage: 100,
        roles: ["teacher"],
      });
      const ids = maadiTeachers.rows.map((row) => row.userId);
      expect(ids).toContain(floater.userId);
      expect(ids).not.toContain(teacherId);
    } finally {
      await db
        .update(TraineesTable)
        .set({ userId: null })
        .where(eq(TraineesTable.id, maadiStudent));
      await destroyMember(student.userId);
      await destroyMember(floater.userId);
    }
  });
});
