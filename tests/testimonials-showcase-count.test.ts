import { describe, expect, it } from "vitest";
import {
  SHOWCASE_ACADEMY_MULTIPLIER,
  showcaseAcademyCount,
} from "@/features/marketing/testimonials/server/showcase-count";

/**
 * These tests pin down a figure that is deliberately larger than the truth
 * (STATE.md D153). They exist so the inflation is visible and one edit away
 * from being removed: dropping the multiplier means changing the constant and
 * the three expectations below, nothing else.
 */
describe("showcaseAcademyCount", () => {
  it("multiplies the real academy count by the recorded multiplier", () => {
    expect(showcaseAcademyCount(3)).toBe(3 * SHOWCASE_ACADEMY_MULTIPLIER);
    expect(showcaseAcademyCount(1)).toBe(SHOWCASE_ACADEMY_MULTIPLIER);
    expect(showcaseAcademyCount(240)).toBe(240 * SHOWCASE_ACADEMY_MULTIPLIER);
  });

  it("reports zero when there are no academies, rather than a multiplied zero claim", () => {
    expect(showcaseAcademyCount(0)).toBe(0);
  });

  it("never reports a negative or fractional figure", () => {
    expect(showcaseAcademyCount(-4)).toBe(0);
    expect(showcaseAcademyCount(2.7)).toBe(2 * SHOWCASE_ACADEMY_MULTIPLIER);
  });

  it("reports zero for a non-finite count rather than NaN", () => {
    expect(showcaseAcademyCount(Number.NaN)).toBe(0);
    expect(showcaseAcademyCount(Number.POSITIVE_INFINITY)).toBe(0);
  });
});
