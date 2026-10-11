import {
  FIRST_NAMES,
  LAST_NAMES,
  SHOWCASE_BRANCHES,
  type ShowcaseBranch,
  TEACHING_TIMES,
} from "./catalog";
import { rngFor, stableId } from "./determinism";

/** Enough that every working day is busy in every branch. */
export const TEACHERS_PER_BRANCH = 23;
const TEACHER_EMAIL_DOMAIN = "horizon-academy.example";

export type ShowcaseTeacher = {
  key: string;
  id: string;
  name: string;
  email: string;
  branchKey: ShowcaseBranch["key"];
  /** Two different start times this teacher's groups use, "HH:mm". */
  times: [string, string];
};

/**
 * The teaching staff: `TEACHERS_PER_BRANCH` per branch, each working in one
 * branch. Names come from the same lists as trainees, picked by a seeded PRNG,
 * so the roster is identical on every run.
 */
export function planTeachers(): ShowcaseTeacher[] {
  const teachers: ShowcaseTeacher[] = [];
  const takenEmails = new Set<string>();

  for (const branch of SHOWCASE_BRANCHES) {
    for (let i = 0; i < TEACHERS_PER_BRANCH; i += 1) {
      const key = `${branch.key}-${i}`;
      const rng = rngFor(`teacher:${key}`);
      const first = rng.pick(FIRST_NAMES);
      const last = rng.pick(LAST_NAMES);

      const base = `${first}.${last}`.toLowerCase();
      let email = `${base}@${TEACHER_EMAIL_DOMAIN}`;
      for (let n = 2; takenEmails.has(email); n += 1) {
        email = `${base}${n}@${TEACHER_EMAIL_DOMAIN}`;
      }
      takenEmails.add(email);

      const firstTime = rng.int(0, TEACHING_TIMES.length - 1);
      const secondTime =
        (firstTime + rng.int(1, TEACHING_TIMES.length - 1)) %
        TEACHING_TIMES.length;
      const times: [string, string] = [
        TEACHING_TIMES[Math.min(firstTime, secondTime)],
        TEACHING_TIMES[Math.max(firstTime, secondTime)],
      ];

      teachers.push({
        key,
        id: stableId(`teacher:${key}`),
        name: `${first} ${last}`,
        email,
        branchKey: branch.key,
        times,
      });
    }
  }
  return teachers;
}
