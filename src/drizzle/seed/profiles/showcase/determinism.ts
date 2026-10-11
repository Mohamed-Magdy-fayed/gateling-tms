import { createHash } from "node:crypto";

/**
 * Everything the showcase profile writes is derived from a string key, never
 * from `Math.random()` or a database default: the same key always yields the
 * same id and the same "random" choices. That is what lets the profile run on
 * every preview build — a row it wrote last time has the same id this time, so
 * "is it there?" is an id lookup, and nothing it has already written ever moves.
 */

const NAMESPACE = "gateling-tms:showcase:v1";

/** A UUID (v5 layout) derived from `key`. Stable across runs and machines. */
export function stableId(key: string): string {
  const hash = createHash("sha1").update(`${NAMESPACE}:${key}`).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export type Rng = {
  /** Uniform in [0, 1). */
  next: () => number;
  /** Integer in [min, max], both inclusive. */
  int: (min: number, max: number) => number;
  /** True with probability `p`. */
  chance: (p: number) => boolean;
  pick: <T>(items: readonly T[]) => T;
  /** Picks by relative weight. */
  weighted: <T>(items: readonly { value: T; weight: number }[]) => T;
};

/** A seeded PRNG (mulberry32) whose sequence depends only on `key`. */
export function rngFor(key: string): Rng {
  let state = createHash("sha1").update(key).digest().readUInt32LE(0);

  const next = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (p) => next() < p,
    pick: (items) => items[Math.floor(next() * items.length)],
    weighted: (items) => {
      const total = items.reduce((sum, item) => sum + item.weight, 0);
      let roll = next() * total;
      for (const item of items) {
        roll -= item.weight;
        if (roll < 0) return item.value;
      }
      return items[items.length - 1].value;
    },
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/** `YYYY-MM-DD` of a UTC date — the calendar-date format `groups.startDate` takes. */
export function toCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
