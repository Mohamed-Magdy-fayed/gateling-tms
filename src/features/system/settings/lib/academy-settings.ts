import { z } from "zod";
import {
  ACADEMY_SETTINGS,
  type AcademySettingControl,
  type AcademySettingDefinition,
} from "./academy-settings-registry";

/**
 * Floating-point slack for the step check: `0.1 + 0.2` is not `0.3`, and a
 * value the number input produced from a valid step must not be refused over
 * that.
 */
const STEP_TOLERANCE = 1e-9;

function isOnStep(value: number, min: number, step: number): boolean {
  const steps = (value - min) / step;
  return Math.abs(steps - Math.round(steps)) < STEP_TOLERANCE;
}

/**
 * The validation for a preference's value, built from its declared control
 * (R4). The one place a control turns into a rule — the save path, the read
 * path and the registry test all go through it.
 */
export function academySettingValueSchema(
  control: AcademySettingControl,
): z.ZodType<boolean | string | number> {
  switch (control.kind) {
    case "boolean":
      return z.boolean();
    case "enum":
      return z.enum(control.options);
    case "number": {
      const { min, max, step } = control;
      return z
        .number()
        .min(min)
        .max(max)
        .refine((value) => isOnStep(value, min, step));
    }
  }
}

/** The registered definition for `code`, or `undefined` for an unknown or retired one. */
export function findAcademySettingDefinition(
  code: string,
): AcademySettingDefinition | undefined {
  return (ACADEMY_SETTINGS as readonly AcademySettingDefinition[]).find(
    (entry) => entry.code === code,
  );
}

export function listAcademySettingDefinitions(): readonly AcademySettingDefinition[] {
  return ACADEMY_SETTINGS;
}
