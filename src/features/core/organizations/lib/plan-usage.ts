/**
 * Presentation math for the plan usage meters and limit notices
 * (phase-08.md steps 1–2). Pure and DOM-free so the thresholds are unit-
 * tested rather than eyeballed in a component.
 */

const BYTES_PER_MB = 1024 * 1024;
const BYTES_PER_GB = 1024 * BYTES_PER_MB;

/** Fraction of the cap at which a usage meter starts warning. */
export const APPROACHING_LIMIT_RATIO = 0.8;

export type UsageSeverity = "ok" | "approaching" | "reached";

/**
 * How full a counter is, 0–100. `null` when the plan doesn't cap this
 * counter — an unlimited allowance has no meaningful percentage, and drawing
 * a bar for one would invent a ceiling that doesn't exist.
 */
export function usagePercent(
  used: number,
  limit: number | null,
): number | null {
  if (limit === null) return null;
  // A zero cap is "nothing allowed", which is full at any usage — dividing by
  // it would give Infinity or NaN.
  if (limit <= 0) return 100;

  return Math.min(100, Math.round((used / limit) * 100));
}

export function usageSeverity(
  used: number,
  limit: number | null,
): UsageSeverity {
  if (limit === null) return "ok";
  if (used >= limit) return "reached";
  if (used >= limit * APPROACHING_LIMIT_RATIO) return "approaching";

  return "ok";
}

export type StorageDisplay = { amount: number; unit: "mb" | "gb" };

/**
 * Bytes in the largest unit that still reads as a real number: 400 MB stays
 * "400 MB" rather than becoming "0.39 GB", and a 1 GB cap stays "1 GB".
 * Rounded to one decimal — a storage meter is an allowance indicator, not an
 * invoice.
 */
export function toStorageDisplay(bytes: number): StorageDisplay {
  if (bytes >= BYTES_PER_GB) {
    return { amount: roundToOneDecimal(bytes / BYTES_PER_GB), unit: "gb" };
  }

  return { amount: roundToOneDecimal(bytes / BYTES_PER_MB), unit: "mb" };
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
