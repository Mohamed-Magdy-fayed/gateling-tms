import { TRPCError } from "@trpc/server";
import type { EnrollmentStatus, PlacementTestStatus } from "@/drizzle/schema";

/**
 * Which statuses each status may move to. A status mapped to an empty list is
 * terminal. Kept free of database and i18n imports so the rules can be unit
 * tested on their own, the same way groups' schedule expander is.
 */
export type TransitionGraph<Status extends string> = Readonly<
  Record<Status, readonly Status[]>
>;

/**
 * Enrollment lifecycle (phase-05.md step 4). A trainee waiting on a placement
 * test starts in `placementTest`; reviewing that test moves them to `waiting`.
 * `postponed` is a pause that can only resume or be abandoned — it can't jump
 * straight to `completed`, since the remaining curriculum was never covered.
 */
export const ENROLLMENT_TRANSITIONS: TransitionGraph<EnrollmentStatus> = {
  placementTest: ["waiting", "cancelled"],
  waiting: ["ongoing", "postponed", "cancelled"],
  ongoing: ["completed", "postponed", "cancelled"],
  postponed: ["ongoing", "cancelled"],
  completed: [],
  cancelled: [],
};

/**
 * Placement test lifecycle. `inProgress` is entered by recording an attempt and
 * left by reviewing it, so a completed test always has a scored response behind
 * it.
 */
export const PLACEMENT_TEST_TRANSITIONS: TransitionGraph<PlacementTestStatus> =
  {
    pending: ["inProgress", "cancelled"],
    inProgress: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };

/**
 * Re-applying the status a row already has is allowed and does nothing, so a
 * retried request can't fail just because the first attempt succeeded.
 */
export function isValidTransition<Status extends string>(
  graph: TransitionGraph<Status>,
  from: Status,
  to: Status,
): boolean {
  if (from === to) return true;

  return graph[from].includes(to);
}

export function assertValidTransition<Status extends string>(
  graph: TransitionGraph<Status>,
  from: Status,
  to: Status,
  message: string,
): void {
  if (isValidTransition(graph, from, to)) return;

  throw new TRPCError({ code: "BAD_REQUEST", message });
}

/**
 * The statuses a row can actually move to right now — what the UI offers, so
 * the dialog and the server can't disagree about what's allowed.
 */
export function allowedTransitions<Status extends string>(
  graph: TransitionGraph<Status>,
  from: Status,
): readonly Status[] {
  return graph[from];
}
