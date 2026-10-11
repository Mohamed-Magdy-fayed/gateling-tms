import { describe, expect, it } from "vitest";
import { SEED_SHOWCASE_ORG_ID } from "@/drizzle/seed/constants";
import { planShowcase } from "@/drizzle/seed/profiles/showcase/plan";

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
    const paid = new Map<string, number>();
    for (const pay of p.activity.payments) {
      const key = pay.enrollmentId ?? "";
      paid.set(key, (paid.get(key) ?? 0) + pay.amount);
    }
    for (const total of paid.values()) expect(total).toBeLessThanOrEqual(5500);
  });
});
