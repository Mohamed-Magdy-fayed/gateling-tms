/**
 * Turning what Gateling Meetings saw into register entries — pure, so the
 * webhook job and the tests agree on it without a database.
 *
 * Students join through the share link and type their own name; Meetings
 * never learns who they are (docs/integrations-meetings.md §5). The only
 * thing to go on is that typed name, so a join counts toward the register
 * **only** when it names exactly one trainee on the class's roster. Anything
 * looser — first-name-only, fuzzy distance — would mark the wrong child
 * present, which is worse than leaving the row for the teacher.
 */

const MS_PER_MINUTE = 60_000;

/** A whole school day — anything past it is a typo, not a late arrival. */
export const MAX_LATE_MINUTES = 600;

// Harakat, superscript alef and Quranic marks: how a name is voweled is not
// part of who it names.
const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const ARABIC_TATWEEL = /\u0640/g;
const ALEF_VARIANTS = /[\u0622\u0623\u0625\u0671]/g;

/**
 * A name reduced to what two spellings of it have in common: case, spacing,
 * punctuation, Arabic vowel marks, and the letter variants people type
 * interchangeably (أ/إ/آ → ا, ى → ي, ة → ه) are all ignored.
 */
export function normalizePersonName(name: string): string {
  return name
    .normalize("NFKC")
    .replace(ARABIC_DIACRITICS, "")
    .replace(ARABIC_TATWEEL, "")
    .replace(ALEF_VARIANTS, "\u0627")
    .replace(/\u0649/g, "\u064A")
    .replace(/\u0629/g, "\u0647")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export type RosterCandidate = {
  traineeId: string;
  /** The trainee's own name, plus their account's name when they have one. */
  names: readonly (string | null | undefined)[];
};

/**
 * The one trainee a joined name belongs to, or null. Two trainees sharing a
 * name is an ambiguity nobody can resolve from a display name, so it matches
 * neither.
 */
export function matchParticipantToTrainee(
  participantName: string,
  roster: readonly RosterCandidate[],
): string | null {
  const wanted = normalizePersonName(participantName);
  if (!wanted) return null;

  const matches = roster.filter((candidate) =>
    candidate.names.some(
      (name) => name != null && normalizePersonName(name) === wanted,
    ),
  );

  return matches.length === 1 ? matches[0].traineeId : null;
}

/**
 * Whole minutes past the scheduled start. Arriving early, or within the
 * first minute, is on time.
 */
export function computeLateMinutes(scheduledAt: Date, joinedAt: Date): number {
  return Math.max(
    0,
    Math.floor((joinedAt.getTime() - scheduledAt.getTime()) / MS_PER_MINUTE),
  );
}

export type ParticipantConnection = {
  joinedAt: Date;
  /** Null while still connected — closed at `endedAt` by the caller. */
  leftAt: Date | null;
};

export type AttendanceTimings = {
  joinedAt: Date;
  leftAt: Date;
  attendedMinutes: number;
};

/**
 * One trainee's time in the room across every connection. A student who
 * drops and rejoins is several connections; one with the class open in two
 * tabs is overlapping ones — so the intervals are merged before summing,
 * and nobody attends more minutes than the class ran.
 */
export function summarizeConnections(
  connections: readonly ParticipantConnection[],
  endedAt: Date,
): AttendanceTimings | null {
  const intervals = connections
    .map((connection) => ({
      start: connection.joinedAt.getTime(),
      end: Math.max(
        connection.joinedAt.getTime(),
        (connection.leftAt ?? endedAt).getTime(),
      ),
    }))
    .sort((a, b) => a.start - b.start);

  if (intervals.length === 0) return null;

  let totalMs = 0;
  let current = intervals[0];
  for (const next of intervals.slice(1)) {
    if (next.start <= current.end) {
      current = { start: current.start, end: Math.max(current.end, next.end) };
    } else {
      totalMs += current.end - current.start;
      current = next;
    }
  }
  totalMs += current.end - current.start;

  return {
    joinedAt: new Date(intervals[0].start),
    leftAt: new Date(Math.max(...intervals.map((interval) => interval.end))),
    attendedMinutes: Math.round(totalMs / MS_PER_MINUTE),
  };
}
