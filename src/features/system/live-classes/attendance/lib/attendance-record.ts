import type { ZoomParticipant } from "./webhook-events";

/** A roster entry a Zoom participant could belong to. */
export type RosterCandidate = {
  traineeId: string;
  email: string | null;
  name: string;
};

/**
 * The part of an attendance row the participant events maintain.
 *
 * `joinedAt` is the *most recent* join rather than the first: someone who
 * dropped and rejoined is in the room from that point on, and the total time
 * they were actually present is accumulated in `attendedMinutes` instead.
 */
export type AttendanceTimes = {
  joinedAt: Date | null;
  leftAt: Date | null;
  attendedMinutes: number;
};

/**
 * Which trainee a Zoom participant is.
 *
 * Email is the only identifier Zoom sends that the org also controls, so it
 * decides whenever it is present on both sides. Most students join as guests
 * without one, so an exact name match is the fallback — but only when it picks
 * out a single trainee: two people called "Ahmed Ali" on one roster is a
 * coin flip, and the teacher's manual override is a better answer than a
 * wrong one. An unmatched participant is left unrecorded rather than guessed.
 */
export function matchParticipantToTrainee(
  participant: ZoomParticipant,
  roster: RosterCandidate[],
): string | null {
  const email = normalize(participant.email);

  if (email) {
    const byEmail = roster.filter(
      (candidate) => normalize(candidate.email) === email,
    );
    if (byEmail.length === 1) return byEmail[0].traineeId;
    // Several roster rows share the address (a parent's inbox for siblings,
    // say) — no more identifying than a duplicate name.
    if (byEmail.length > 1) return null;
  }

  const name = normalize(participant.name);
  if (!name) return null;

  const byName = roster.filter(
    (candidate) => normalize(candidate.name) === name,
  );

  return byName.length === 1 ? byName[0].traineeId : null;
}

/**
 * Folds a join event into the row, ignoring one that predates what is already
 * recorded — Zoom retries deliveries and does not promise order, and an older
 * join arriving late must not rewind the current one.
 */
export function applyJoin(
  current: AttendanceTimes | null,
  joinedAt: Date,
): AttendanceTimes {
  if (!current) {
    return { joinedAt, leftAt: null, attendedMinutes: 0 };
  }

  if (current.joinedAt && current.joinedAt.getTime() >= joinedAt.getTime()) {
    return current;
  }

  return { ...current, joinedAt };
}

/**
 * Folds a leave event into the row, adding the minutes between the open join
 * and this leave. A redelivery of the same leave lands on the `<=` guard and
 * adds nothing, so the total can't drift upward on retries.
 */
export function applyLeave(
  current: AttendanceTimes | null,
  leftAt: Date,
): AttendanceTimes {
  if (!current) {
    // A leave with no join on record: the join event was lost or is still in
    // flight. Being in the meeting at all is what presence means, so the row
    // is created — with no minutes, since nothing says how long.
    return { joinedAt: null, leftAt, attendedMinutes: 0 };
  }

  if (current.leftAt && current.leftAt.getTime() >= leftAt.getTime()) {
    return current;
  }

  return {
    joinedAt: current.joinedAt,
    leftAt,
    attendedMinutes:
      current.attendedMinutes + minutesBetween(current.joinedAt, leftAt),
  };
}

function minutesBetween(from: Date | null, to: Date): number {
  if (!from) return 0;
  const minutes = Math.round((to.getTime() - from.getTime()) / 60_000);
  // A clock skew between Zoom's stamps would otherwise subtract time.
  return Math.max(0, minutes);
}

function normalize(value: string | null): string | null {
  const normalized = value?.trim().toLowerCase().replace(/\s+/g, " ");
  return normalized || null;
}
