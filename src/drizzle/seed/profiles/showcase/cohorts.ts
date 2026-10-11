import type { GroupScheduleSlot } from "@/drizzle/schema";
import { generateSessionOccurrences } from "@/features/system/students/groups/server/schedule";
import { DAY_PAIRS, type ShowcaseBranch } from "./catalog";
import type { PlannedCourse } from "./content";
import {
  addDays,
  addMinutes,
  rngFor,
  stableId,
  toCalendarDate,
} from "./determinism";
import type { ShowcaseTeacher } from "./teachers";

/**
 * The academy's history starts here and is fixed: cohort `k` always opens on
 * the same date in the same branch with the same course, teacher, schedule and
 * roster. Only how many cohorts exist, and what state each row is in, depends
 * on "now" — so a later run appends new cohorts and moves time forward, and
 * never rewrites the past.
 */
export const SHOWCASE_ANCHOR = new Date("2024-10-05T00:00:00Z");
/**
 * A new cohort opens every day, taking turns between the branches — so each
 * branch opens one every three days.
 */
export const COHORT_SPACING_DAYS = 1;
/** Cohorts this far ahead already exist, enrolling and in placement. */
export const UPCOMING_WINDOW_DAYS = 35;
/** A group is set up five weeks out — before its earliest enrollment (28 days). */
const GROUP_LEAD_DAYS = 35;
/** Share of groups that are one-to-one. */
const PRIVATE_GROUP_SHARE = 0.45;
/** One-to-one classes cost more than a seat in a group. */
const PRIVATE_PRICE_FACTOR = 1.5;
/** Share of seats taken by a returning student of the same branch, when one is free. */
const RETURNING_SEAT_SHARE = 0.45;

export type PlannedBranch = ShowcaseBranch & { id: string };

export type PlannedSession = {
  id: string;
  index: number;
  scheduledAt: Date;
  endsAt: Date;
  durationMinutes: number;
  levelIndex: number;
  lectureId: string;
  /** Called off on its own, regardless of what happens to the group. */
  cancelled: boolean;
};

export type Seat = {
  traineeNumber: number;
  returning: boolean;
  enrollmentId: string;
  enrolledAt: Date;
  /** When the placement test was taken; null for a returning trainee. */
  placementDoneAt: Date | null;
  /** Index of the first session missed for good, and what it became. */
  drop: { atSession: number; kind: "cancelled" | "postponed" } | null;
  attendanceRate: number;
  skill: number;
  installments: number;
};

/**
 * A group that stopped part-way: paused (its students postponed) or cancelled
 * outright. From `atSession` on its classes are called off, decided at `at` —
 * an hour after the last class it held.
 */
export type CohortHalt = {
  kind: "paused" | "cancelled";
  atSession: number;
  at: Date;
};

export type Cohort = {
  index: number;
  id: string;
  name: string;
  course: PlannedCourse;
  branch: PlannedBranch;
  teacher: ShowcaseTeacher;
  isPrivate: boolean;
  /** What a seat in this group costs. */
  price: number;
  schedule: GroupScheduleSlot[];
  startDate: string;
  createdAt: Date;
  sessions: PlannedSession[];
  /** End of the last class held, had the group run to the end. */
  endsAt: Date;
  levels: {
    firstStart: Date;
    lastEnd: Date;
    lastIndex: number;
    firstIndex: number;
  }[];
  seats: Seat[];
  halt: CohortHalt | null;
};

export type PlannedTrainee = {
  number: number;
  id: string;
  /** Every cohort a trainee joins is in this branch. */
  branchId: string;
  firstEnrolledAt: Date;
  firstCohortIndex: number;
};

function cohortCount(now: Date): number {
  const horizon = addDays(now, UPCOMING_WINDOW_DAYS).getTime();
  const span = horizon - SHOWCASE_ANCHOR.getTime();
  return Math.max(0, Math.floor(span / (COHORT_SPACING_DAYS * 86_400_000)) + 1);
}

function addTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Branch `k % 3`, and that branch's teachers in turn. A teacher gets a new
 * group only every `3 × teachers-per-branch` days — far longer than any course
 * runs — so no teacher is ever double-booked, whatever slot the group gets.
 */
function placeCohort(
  index: number,
  branches: PlannedBranch[],
  teachers: ShowcaseTeacher[],
) {
  const branch = branches[index % branches.length];
  const branchTeachers = teachers.filter((t) => t.branchKey === branch.key);
  const branchCohortIndex = Math.floor(index / branches.length);
  const teacher = branchTeachers[branchCohortIndex % branchTeachers.length];
  return { branch, teacher };
}

function planHalt(
  rng: ReturnType<typeof rngFor>,
  sessions: PlannedSession[],
): CohortHalt | null {
  if (sessions.length < 4) return null;
  const roll = rng.next();
  if (roll >= 0.06) return null;
  const atSession = rng.int(1, sessions.length - 2);
  return {
    kind: roll < 0.03 ? "cancelled" : "paused",
    atSession,
    at: addMinutes(sessions[atSession - 1].endsAt, 60),
  };
}

export function planCohorts(input: {
  now: Date;
  timeZone: string;
  courses: PlannedCourse[];
  branches: PlannedBranch[];
  teachers: ShowcaseTeacher[];
}): { cohorts: Cohort[]; trainees: PlannedTrainee[] } {
  const cohorts: Cohort[] = [];
  const trainees: PlannedTrainee[] = [];
  // Students who finished a course and may come back — per branch, since a
  // student stays with their branch.
  const returningPools = new Map<
    string,
    { traineeNumber: number; availableFrom: Date }[]
  >(input.branches.map((branch) => [branch.id, []]));
  const total = cohortCount(input.now);

  for (let k = 0; k < total; k += 1) {
    const rng = rngFor(`cohort:${k}`);
    const course = rng.weighted(
      input.courses.map((c) => ({ value: c, weight: c.course.weight })),
    );
    const { branch, teacher } = placeCohort(k, input.branches, input.teachers);
    const isPrivate = rng.chance(PRIVATE_GROUP_SHARE);
    const [dayA, dayB] = rng.pick(DAY_PAIRS);
    const startTime = rng.pick(teacher.times);
    const endTime = addTime(startTime, course.course.durationMinutes);
    const schedule: GroupScheduleSlot[] = [
      { day: dayA, startTime, endTime },
      { day: dayB, startTime, endTime },
    ];
    const opensOn = addDays(SHOWCASE_ANCHOR, k * COHORT_SPACING_DAYS);
    const startDate = toCalendarDate(opensOn);
    const lectureIds = course.levels.flatMap((level) => level.lectureIds);

    const occurrences = generateSessionOccurrences({
      schedule,
      startDate,
      sessionCount: lectureIds.length,
      timeZone: input.timeZone,
    });
    const id = stableId(`group:${k}`);
    const sessions = occurrences.map(
      (occurrence, index): PlannedSession => ({
        id: stableId(`session:${k}:${index}`),
        index,
        scheduledAt: occurrence.scheduledAt,
        endsAt: addMinutes(occurrence.scheduledAt, occurrence.durationMinutes),
        durationMinutes: occurrence.durationMinutes,
        levelIndex: Math.floor(index / course.course.sessionsPerLevel),
        lectureId: lectureIds[index],
        // Never the first or last class of a cohort.
        cancelled:
          index > 0 && index < occurrences.length - 1 && rng.chance(0.02),
      }),
    );
    const halt = planHalt(rng, sessions);
    const held = sessions.filter((s) => !s.cancelled);
    const levels = course.levels.map((_, levelIndex) => {
      const inLevel = sessions.filter((s) => s.levelIndex === levelIndex);
      return {
        firstIndex: inLevel[0].index,
        lastIndex: inLevel[inLevel.length - 1].index,
        firstStart: inLevel[0].scheduledAt,
        lastEnd: inLevel[inLevel.length - 1].endsAt,
      };
    });

    const seatCount = isPrivate ? 1 : rng.int(5, 10);
    const pool = returningPools.get(branch.id) ?? [];
    const seats: Seat[] = [];
    for (let s = 0; s < seatCount; s += 1) {
      const seatRng = rngFor(`seat:${k}:${s}`);
      const enrolledAt = addMinutes(
        addDays(sessions[0].scheduledAt, -seatRng.int(3, 28)),
        -seatRng.int(0, 9) * 60,
      );

      let traineeNumber: number | undefined;
      if (seatRng.chance(RETURNING_SEAT_SHARE)) {
        const poolIndex = pool.findIndex(
          (p) => p.availableFrom.getTime() < enrolledAt.getTime(),
        );
        if (poolIndex >= 0) {
          traineeNumber = pool[poolIndex].traineeNumber;
          pool.splice(poolIndex, 1);
        }
      }
      const returning = traineeNumber !== undefined;
      if (traineeNumber === undefined) {
        traineeNumber = trainees.length;
        trainees.push({
          number: traineeNumber,
          id: stableId(`trainee:${traineeNumber}`),
          branchId: branch.id,
          firstEnrolledAt: enrolledAt,
          firstCohortIndex: k,
        });
      }

      const dropRoll = seatRng.next();
      const plannedDrop =
        dropRoll < 0.08
          ? {
              atSession: seatRng.int(
                2,
                Math.max(2, Math.floor(sessions.length / 2)),
              ),
              kind: "cancelled" as const,
            }
          : dropRoll < 0.12
            ? {
                atSession: seatRng.int(2, Math.max(2, sessions.length - 2)),
                kind: "postponed" as const,
              }
            : null;
      // A student can't leave a group after it has already stopped.
      const drop =
        plannedDrop &&
        plannedDrop.atSession < sessions.length &&
        (!halt || plannedDrop.atSession < halt.atSession)
          ? plannedDrop
          : null;

      seats.push({
        traineeNumber,
        returning,
        enrollmentId: stableId(`enrollment:${k}:${s}`),
        enrolledAt,
        placementDoneAt: returning
          ? null
          : addMinutes(enrolledAt, 24 * 60 + 45),
        drop,
        attendanceRate: 0.72 + seatRng.next() * 0.26,
        skill: 0.55 + seatRng.next() * 0.42,
        installments: seatRng.weighted([
          { value: 1, weight: 55 },
          { value: 2, weight: 30 },
          { value: 3, weight: 15 },
        ]),
      });
    }

    const endsAt = held[held.length - 1].endsAt;
    // Whoever finishes the course may come back for another one.
    if (!halt) {
      for (const seat of seats) {
        if (!seat.drop) {
          pool.push({
            traineeNumber: seat.traineeNumber,
            availableFrom: endsAt,
          });
        }
      }
    }

    const number = String(k + 1).padStart(4, "0");
    cohorts.push({
      index: k,
      id,
      name: isPrivate
        ? `${course.course.name} · Private ${number}`
        : `${course.course.name} · Batch ${number}`,
      course,
      branch,
      teacher,
      isPrivate,
      price: isPrivate
        ? Math.round((course.course.price * PRIVATE_PRICE_FACTOR) / 50) * 50
        : course.course.price,
      schedule,
      startDate,
      createdAt: addDays(opensOn, -GROUP_LEAD_DAYS),
      sessions,
      endsAt,
      levels,
      seats,
      halt,
    });
  }

  return { cohorts, trainees };
}
