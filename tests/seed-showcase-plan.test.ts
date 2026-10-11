import { describe, expect, it } from "vitest";
import { SEED_SHOWCASE_ORG_ID } from "@/drizzle/seed/constants";
import { SHOWCASE_COURSES } from "@/drizzle/seed/profiles/showcase/catalog";
import { planShowcase } from "@/drizzle/seed/profiles/showcase/plan";
import { TEACHERS_PER_BRANCH } from "@/drizzle/seed/profiles/showcase/teachers";

const NOW = new Date("2026-10-11T12:00:00Z");
const plan = (now: Date) =>
  planShowcase({
    organizationId: SEED_SHOWCASE_ORG_ID,
    timeZone: "Africa/Cairo",
    now,
  });

const p = plan(NOW);
const later = plan(new Date(NOW.getTime() + 75 * 86_400_000));

type Row = { id?: string; createdAt?: Date | null };
const tables = (x: ReturnType<typeof plan>): Record<string, Row[]> => ({
  ...x.content,
  ...x.structure,
  ...x.activity,
});

describe("showcase seed plan", () => {
  it("is fully deterministic for the same clock", () => {
    expect(JSON.stringify(plan(NOW))).toBe(JSON.stringify(p));
  });

  it("covers two years with about two thousand trainees", () => {
    expect(p.structure.trainees.length).toBeGreaterThan(1800);
    expect(p.structure.trainees.length).toBeLessThan(2400);
    const first = Math.min(
      ...p.structure.trainees.map((t) => t.createdAt?.getTime() ?? 0),
    );
    expect(NOW.getTime() - first).toBeGreaterThan(700 * 86_400_000);
  });

  it("gives every row in a table a unique id", () => {
    for (const [name, rows] of Object.entries(tables(p))) {
      const ids = rows.map((r) => r.id).filter(Boolean);
      expect(new Set(ids).size, name).toBe(ids.length);
    }
  });

  it("never writes a row dated after now", () => {
    for (const [name, rows] of Object.entries(tables(p))) {
      for (const row of rows) {
        if (row.createdAt)
          expect(row.createdAt.getTime(), name).toBeLessThanOrEqual(
            NOW.getTime(),
          );
      }
    }
  });

  it("keeps every earlier row, with its fixed facts unchanged, as time passes", () => {
    const laterTables = tables(later);
    for (const [name, rows] of Object.entries(tables(p))) {
      const laterById = new Map(laterTables[name].map((r) => [r.id, r]));
      for (const row of rows) {
        if (!row.id) continue;
        const next = laterById.get(row.id);
        expect(next, `${name} ${row.id}`).toBeDefined();
        expect(next?.createdAt?.getTime(), name).toBe(row.createdAt?.getTime());
      }
    }
    const laterTrainees = new Map(
      later.structure.trainees.map((t) => [t.id, t.name]),
    );
    for (const trainee of p.structure.trainees) {
      expect(laterTrainees.get(trainee.id)).toBe(trainee.name);
    }
    expect(later.structure.trainees.length).toBeGreaterThan(
      p.structure.trainees.length,
    );
  });

  it("has upcoming, running and finished cohorts at once", () => {
    const statuses = new Set(p.structure.enrollments.map((e) => e.status));
    for (const status of [
      "placementTest",
      "waiting",
      "ongoing",
      "completed",
      "cancelled",
      "postponed",
    ]) {
      expect(statuses.has(status as never), status).toBe(true);
    }
    expect(p.structure.groups.some((g) => g.status === "active")).toBe(true);
    expect(p.structure.sessions.some((s) => s.status === "scheduled")).toBe(
      true,
    );
  });

  it("never double-books a teacher", () => {
    const byTeacher = new Map<string, { start: number; end: number }[]>();
    for (const s of p.structure.sessions) {
      if (s.status === "cancelled" || !s.teacherId) continue;
      const start = s.scheduledAt.getTime();
      const list = byTeacher.get(s.teacherId) ?? [];
      list.push({ start, end: start + s.durationMinutes * 60_000 });
      byTeacher.set(s.teacherId, list);
    }
    for (const list of byTeacher.values()) {
      list.sort((a, b) => a.start - b.start);
      for (let i = 1; i < list.length; i += 1) {
        expect(list[i].start).toBeGreaterThanOrEqual(list[i - 1].end);
      }
    }
  });

  it("respects the database's unique constraints", () => {
    const uniqueOn = <T>(rows: T[], key: (r: T) => string) =>
      expect(new Set(rows.map(key)).size).toBe(rows.length);
    uniqueOn(
      p.structure.sessions,
      (s) => `${s.groupId}|${s.scheduledAt.toISOString()}`,
    );
    uniqueOn(p.structure.groupStudents, (g) => `${g.groupId}|${g.traineeId}`);
    uniqueOn(p.activity.attendance, (a) => `${a.sessionId}|${a.traineeId}`);
    uniqueOn(
      p.structure.enrollmentLevels,
      (l) => `${l.enrollmentId}|${l.levelId}`,
    );
    uniqueOn(
      p.structure.availability,
      (a) => `${a.teacherId}|${a.day}|${a.startTime}`,
    );
    uniqueOn(p.structure.users, (u) => u.email);
  });

  it("only references rows the plan also writes (no dangling foreign keys)", () => {
    const ids = (rows: { id?: string }[]) => new Set(rows.map((r) => r.id));
    const { content: c, structure: s, activity: a } = p;
    const users = ids(s.users);
    const trainees = ids(s.trainees);
    const enrollments = ids(s.enrollments);
    const groups = ids(s.groups);
    const sessions = ids(s.sessions);
    const courses = ids(c.courses);
    const levels = ids(c.levels);
    const forms = ids(c.forms);
    const check = (
      label: string,
      set: Set<string | undefined>,
      values: (string | null | undefined)[],
    ) => {
      for (const value of values)
        if (value) expect(set.has(value), `${label} ${value}`).toBe(true);
    };
    check(
      "enrollment.trainee",
      trainees,
      s.enrollments.map((e) => e.traineeId),
    );
    check(
      "enrollment.course",
      courses,
      s.enrollments.map((e) => e.courseId),
    );
    check(
      "payment.enrollment",
      enrollments,
      a.payments.map((x) => x.enrollmentId),
    );
    check(
      "payment.trainee",
      trainees,
      a.payments.map((x) => x.traineeId),
    );
    check(
      "level.enrollment",
      enrollments,
      s.enrollmentLevels.map((x) => x.enrollmentId),
    );
    check(
      "level.level",
      levels,
      s.enrollmentLevels.map((x) => x.levelId),
    );
    check(
      "placement.trainee",
      trainees,
      s.placementTests.map((x) => x.traineeId),
    );
    check(
      "roster.group",
      groups,
      s.groupStudents.map((x) => x.groupId),
    );
    check(
      "roster.trainee",
      trainees,
      s.groupStudents.map((x) => x.traineeId),
    );
    check(
      "session.group",
      groups,
      s.sessions.map((x) => x.groupId),
    );
    check(
      "attendance.session",
      sessions,
      a.attendance.map((x) => x.sessionId),
    );
    check(
      "attendance.trainee",
      trainees,
      a.attendance.map((x) => x.traineeId),
    );
    check(
      "certificate.trainee",
      trainees,
      a.certificates.map((x) => x.traineeId),
    );
    check(
      "certificate.group",
      groups,
      a.certificates.map((x) => x.groupId),
    );
    check(
      "response.form",
      forms,
      a.responses.map((x) => x.formId),
    );
    check(
      "response.user",
      users,
      a.responses.map((x) => x.respondentUserId),
    );
    check(
      "note.trainee",
      trainees,
      a.notes.map((x) => x.traineeId),
    );
    check(
      "trainee.user",
      users,
      s.trainees.map((x) => x.userId),
    );
    check(
      "group.teacher",
      users,
      s.groups.map((x) => x.teacherId),
    );
  });

  it("only records attendance for classes that were held", () => {
    const sessions = new Map(p.structure.sessions.map((s) => [s.id, s]));
    for (const row of p.activity.attendance) {
      expect(sessions.get(row.sessionId)?.status).toBe("completed");
    }
  });

  it("issues certificates only for completed enrollments", () => {
    const completed = new Set(
      p.structure.enrollments
        .filter((e) => e.status === "completed")
        .map((e) => `${e.traineeId}|${e.courseId}`),
    );
    for (const cert of p.activity.certificates) {
      expect(completed.has(`${cert.traineeId}|${cert.courseId}`)).toBe(true);
    }
    expect(p.activity.certificates.length).toBeGreaterThan(500);
  });

  it("never collects more than the course fee", () => {
    // A one-to-one class costs at most 1.5× the dearest course.
    const ceiling = Math.max(...SHOWCASE_COURSES.map((c) => c.price)) * 1.5;
    const paid = new Map<string, number>();
    for (const pay of p.activity.payments) {
      const key = pay.enrollmentId ?? "";
      paid.set(key, (paid.get(key) ?? 0) + pay.amount);
    }
    for (const total of paid.values())
      expect(total).toBeLessThanOrEqual(ceiling);
  });

  describe("branches (v2)", () => {
    const s = p.structure;
    const a = p.activity;
    const branchOf = <T extends { id?: string; branchId: string }>(rows: T[]) =>
      new Map(rows.map((r) => [r.id, r.branchId]));

    it("has three branches, each with its own teaching staff", () => {
      expect(s.branches.map((b) => b.name)).toEqual([
        "Nasr City",
        "Maadi",
        "Online",
      ]);
      expect(s.membershipBranches).toHaveLength(3 * TEACHERS_PER_BRANCH);
      for (const branch of s.branches) {
        const staff = s.membershipBranches.filter(
          (m) => m.branchId === branch.id,
        );
        expect(staff).toHaveLength(TEACHERS_PER_BRANCH);
      }
      // Every teacher is free on all six working days, in their branch.
      const days = new Map<string, Set<number>>();
      for (const slot of s.availability) {
        const set = days.get(slot.teacherId) ?? new Set();
        set.add(slot.day);
        days.set(slot.teacherId, set);
      }
      for (const set of days.values()) expect(set.size).toBe(6);
    });

    it("keeps every row in its parent's branch", () => {
      const groups = branchOf(s.groups);
      const trainees = branchOf(s.trainees);
      const enrollments = branchOf(s.enrollments);
      const sessions = branchOf(s.sessions);
      const same = (label: string, pairs: [string, string | undefined][]) => {
        for (const [own, parent] of pairs) expect(own, label).toBe(parent);
      };
      same(
        "session/group",
        s.sessions.map((x) => [x.branchId, groups.get(x.groupId)]),
      );
      same(
        "roster/group",
        s.groupStudents.map((x) => [x.branchId, groups.get(x.groupId)]),
      );
      same(
        "roster/trainee",
        s.groupStudents.map((x) => [x.branchId, trainees.get(x.traineeId)]),
      );
      same(
        "enrollment/trainee",
        s.enrollments.map((x) => [x.branchId, trainees.get(x.traineeId)]),
      );
      same(
        "level/enrollment",
        s.enrollmentLevels.map((x) => [
          x.branchId,
          enrollments.get(x.enrollmentId),
        ]),
      );
      same(
        "placement/trainee",
        s.placementTests.map((x) => [x.branchId, trainees.get(x.traineeId)]),
      );
      same(
        "payment/enrollment",
        a.payments.map((x) => [
          x.branchId,
          enrollments.get(x.enrollmentId ?? ""),
        ]),
      );
      same(
        "attendance/session",
        a.attendance.map((x) => [x.branchId, sessions.get(x.sessionId)]),
      );
      same(
        "certificate/group",
        a.certificates.map((x) => [x.branchId, groups.get(x.groupId ?? "")]),
      );
      same(
        "note/trainee",
        a.notes.map((x) => [x.branchId, trainees.get(x.traineeId)]),
      );
    });

    it("runs 4–8 class courses in one-to-one groups or groups of 5–10", () => {
      for (const group of s.groups) {
        expect(group.sessionCount).toBeGreaterThanOrEqual(4);
        expect(group.sessionCount).toBeLessThanOrEqual(8);
      }
      // Group size = its roster.
      const seats = new Map<string, number>();
      for (const r of s.groupStudents)
        seats.set(r.groupId, (seats.get(r.groupId) ?? 0) + 1);
      const sizes = [...seats.values()];
      expect(sizes.some((n) => n === 1)).toBe(true);
      expect(sizes.some((n) => n >= 5)).toBe(true);
      for (const n of sizes) expect(n === 1 || n <= 10).toBe(true);
    });

    it("has paused and cancelled groups whose later classes are called off", () => {
      for (const status of ["paused", "cancelled"] as const) {
        const stopped = s.groups.filter((g) => g.status === status);
        expect(stopped.length, status).toBeGreaterThan(0);
        for (const group of stopped) {
          const classes = s.sessions.filter((x) => x.groupId === group.id);
          expect(classes.some((x) => x.status === "scheduled")).toBe(false);
          expect(classes.some((x) => x.status === "cancelled")).toBe(true);
        }
      }
    });

    it("has final exams awaiting a grade and ones already graded", () => {
      const scored = a.responses.filter((r) => r.score !== null);
      const pending = a.responses.filter((r) => r.score === null);
      expect(scored.length).toBeGreaterThan(0);
      expect(pending.length).toBeGreaterThan(0);
      for (const r of pending) {
        expect(r.answers?.some((x) => typeof x.text === "string")).toBe(true);
      }
    });

    it("links submitted placement tests to their responses", () => {
      const responses = new Set(a.responses.map((r) => r.id));
      const submitted = s.placementTests.filter((t) => t.responseId);
      expect(submitted.length).toBeGreaterThan(50);
      for (const t of submitted) {
        expect(responses.has(t.responseId ?? "")).toBe(true);
        expect(t.status).toBe("completed");
      }
    });

    it("keeps every working day busy in every branch", () => {
      const from = NOW.getTime() - 28 * 86_400_000;
      const groups = branchOf(s.groups);
      const busy = new Set<string>();
      for (const x of s.sessions) {
        const at = x.scheduledAt.getTime();
        if (at < from || at > NOW.getTime() || x.status === "cancelled")
          continue;
        // Cairo is UTC+2/+3; noon UTC on the same date is safely that day.
        const day = new Date(at + 3 * 3_600_000).getUTCDay();
        busy.add(`${groups.get(x.groupId)}|${day}`);
      }
      for (const branch of s.branches)
        for (const day of [6, 0, 1, 2, 3, 4])
          expect(
            busy.has(`${branch.id}|${day}`),
            `${branch.name} day ${day}`,
          ).toBe(true);
    });
  });
});
