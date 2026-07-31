/**
 * Multiplier applied to the real number of signed-up academies before the
 * landing hero shows it.
 *
 * This inflates the figure — the label next to it says "academies", and the
 * number is five times how many there actually are. Mohamed's explicit call
 * (STATE.md D153) after the overstatement was raised; it is recorded rather
 * than hidden, and it lives here alone so switching to the true figure is a
 * one-line change with a test already pointing at it.
 */
export const SHOWCASE_ACADEMY_MULTIPLIER = 5;

/**
 * The academy figure the landing hero prints.
 *
 * Zero stays zero: multiplying nothing still has to read as nothing, so the
 * band can hide itself rather than claim "0 academies".
 */
export function showcaseAcademyCount(realAcademyCount: number): number {
  if (!Number.isFinite(realAcademyCount) || realAcademyCount <= 0) return 0;
  return Math.floor(realAcademyCount) * SHOWCASE_ACADEMY_MULTIPLIER;
}
