import type { GroupScheduleSlot } from "@/drizzle/schema";
import { generateSessionOccurrences } from "@/features/system/students/groups/server/schedule";
import { DAY_PAIRS, SHOWCASE_TEACHERS, type ShowcaseTeacher } from "./catalog";
import type { PlannedCourse } from "./content";
import {
  addDays,
  addMinutes,
  rngFor,
  stableId,
  toCalendarDate,
} from "./determinism";

/**
 * The academy's history starts here and is fixed: cohort `k` always opens on
 * the same date with the same course, teacher, schedule and roster. Only how
 * many cohorts exist, and what state each row is in, depends on "now" — so a
 * later run appends new cohorts and moves time forward, and never rewrites
 * the past.
 */
export const SHOWCASE_ANCHOR = new Date("2024-10-05T00:00:00Z");
export const COHORT_SPACING_DAYS = 5;
/** Cohorts this far ahead already exist, enrolling and in placement. */
export const UPCOMING_WINDOW_DAYS = 30;
/** A group is set up five weeks out — before its earliest enrollment (28 days). */
const GROUP_LEAD_DAYS = 35;
/** Share of follow-on course seats taken by a returning General English graduate. */
const RETURNING_SEAT_SHARE = 0.35;
const FOLLOW_ON_COURSES = new Set([
  "ielts",
  "business",
  "conversation",
  "grammar",
]);

export type PlannedSession = {
  id: string;
  index: number;
  scheduledAt: Date;
  endsAt: Date;
  durationMinutes: number;
  levelIndex: number;
  lectureId: string;
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

export type Cohort = {
  index: number;
  id: string;
  name: string;
  course: PlannedCourse;
  teacher: ShowcaseTeacher & { id: string };
  schedule: GroupScheduleSlot[];
  startDate: string;
  createdAt: Date;
  sessions: PlannedSession[];
  /** End of the last class that wasn't cancelled. */
  endsAt: Date;
  levels: {
    firstStart: Date;
    lastEnd: Date;
    lastIndex: number;
    firstIndex: number;
  }[];
  seats: Seat[];
};

export type PlannedTrainee = {
  number: number;
  id: string;
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
 * Teacher `k % 8`, and one of that teacher's six fixed slots (3 disjoint day
 * pairs × 2 non-overlapping start times). A teacher gets a new cohort every 40
 * days and only repeats a slot after 240, longer than any course runs — so no
 * teacher is ever double-booked.
 */
function scheduleFor(index: number, durationMinutes: number) {
  const teacher = SHOWCASE_TEACHERS[index % SHOWCASE_TEACHERS.length];
  const slot = Math.floor(index / SHOWCASE_TEACHERS.length) % 6;
  const [dayA, dayB] = DAY_PAIRS[slot % DAY_PAIRS.length];
  const startTime = teacher.times[Math.floor(slot / DAY_PAIRS.length)];
  const endTime = addTime(startTime, durationMinutes);
  const schedule: GroupScheduleSlot[] = [
    { day: dayA, startTime, endTime },
    { day: dayB, startTime, endTime },
  ];
  return { teacher, schedule };
}

export function planCohorts(input: {
  now: Date;
  timeZone: string;
  courses: PlannedCourse[];
}): { cohorts: Cohort[]; trainees: PlannedTrainee[] } {
  const cohorts: Cohort[] = [];
  const trainees: PlannedTrainee[] = [];
  const returningPool: { traineeNumber: number; availableFrom: Date }[] = [];
  const total = cohortCount(input.now);

  for (let k = 0; k < total; k += 1) {
    const rng = rngFor(`cohort:${k}`);
    const course = rng.weighted(
      input.courses.map((c) => ({ value: c, weight: c.course.weight })),
    );
    const { teacher, schedule } = scheduleFor(k, course.course.durationMinutes);
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

    const seatCount = rng.int(12, 18);
    const seats: Seat[] = [];
    for (let s = 0; s < seatCount; s += 1) {
      const seatRng = rngFor(`seat:${k}:${s}`);
      const enrolledAt = addMinutes(
        addDays(sessions[0].scheduledAt, -seatRng.int(3, 28)),
        -seatRng.int(0, 9) * 60,
      );

      let traineeNumber: number | undefined;
      if (
        FOLLOW_ON_COURSES.has(course.course.key) &&
        seatRng.chance(RETURNING_SEAT_SHARE)
      ) {
        const poolIndex = returningPool.findIndex(
          (p) => p.availableFrom.getTime() < enrolledAt.getTime(),
        );
        if (poolIndex >= 0) {
          traineeNumber = returningPool[poolIndex].traineeNumber;
          returningPool.splice(poolIndex, 1);
        }
      }
      const returning = traineeNumber !== undefined;
      if (traineeNumber === undefined) {
        traineeNumber = trainees.length;
        trainees.push({
          number: traineeNumber,
          id: stableId(`trainee:${traineeNumber}`),
          firstEnrolledAt: enrolledAt,
          firstCohortIndex: k,
        });
      }

      const dropRoll = seatRng.next();
      const drop =
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
    if (course.course.key === "general") {
      for (const seat of seats) {
        if (!seat.drop) {
          returningPool.push({
            traineeNumber: seat.traineeNumber,
            availableFrom: endsAt,
          });
        }
      }
    }

    cohorts.push({
      index: k,
      id,
      name: `${course.course.name} · Batch ${String(k + 1).padStart(3, "0")}`,
      course,
      teacher: { ...teacher, id: stableId(`teacher:${teacher.key}`) },
      schedule,
      startDate,
      createdAt: addDays(opensOn, -GROUP_LEAD_DAYS),
      sessions,
      endsAt,
      levels,
      seats,
    });
  }

  return { cohorts, trainees };
}
