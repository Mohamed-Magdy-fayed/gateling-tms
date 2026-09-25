/**
 * Every academy preference this system knows, keyed by the stable code stored
 * in `organization_settings.code` (design doc `academy-preferences.md`). The
 * row holds one academy's override; this registry holds everything else:
 *
 * - `code`     zero-padded, never reused. A retired preference keeps its
 *              number so an old row can never be misread as a new one; the
 *              reader ignores rows whose code is no longer here.
 * - `group`    which card the preference sits on in the preferences UI.
 * - `control`  how it is edited (R4). The value's validation is built from
 *              this by `academySettingValueSchema`, so the screen and the
 *              rule can never disagree, and nothing reads Zod internals.
 * - `default`  what an academy gets until it chooses otherwise — taken from
 *              the reference academy's behavior, and it must parse under
 *              `control` (a unit test holds every entry to that).
 * - `appliesTo` what a change does to records that already exist (R3):
 *              `"future"` touches new records only; `{ reapply: event }`
 *              enqueues that Inngest event with `{ organizationId, code }`
 *              in the same transaction as the save (R10), and the handler
 *              re-reads the current value, so a retry is harmless.
 *
 * The build rule: a preference exists only because a real academy wanted
 * something different from another. Every entry carries a `requestedBy`
 * comment naming that academy, the disagreement and the date.
 *
 * gstack-shortcut(dec-28099644): `requestedBy` is a comment, enforced in
 * review only (R5, D9 B). Upgrade it to a required typed field with a unit
 * test when a preference merges without a named requester, or when agents add
 * preferences unattended.
 */

export type AcademySettingControl =
  | { kind: "boolean" }
  | { kind: "enum"; options: readonly [string, ...string[]] }
  | { kind: "number"; min: number; max: number; step: number };

/** The stored and returned value type a control produces. */
export type AcademySettingControlValue<C extends AcademySettingControl> =
  C extends { kind: "boolean" }
    ? boolean
    : C extends { kind: "enum"; options: infer O extends readonly string[] }
      ? O[number]
      : number;

/** Inngest event names follow the `domain/what-happened` shape used everywhere else. */
export type AcademySettingReapplyEvent = `${string}/${string}`;

export type AcademySettingAppliesTo =
  | "future"
  | { reapply: AcademySettingReapplyEvent };

export type AcademySettingGroup = "scheduling" | "attendance";

export type AcademySettingDefinition<
  C extends AcademySettingControl = AcademySettingControl,
> = {
  code: string;
  group: AcademySettingGroup;
  control: C;
  default: AcademySettingControlValue<C>;
  appliesTo: AcademySettingAppliesTo;
};

/**
 * Add an entry with the next unused code and a `requestedBy` comment:
 *
 *   // requestedBy: <academy> — <how its answer differs from another's> (<date>)
 *
 * together with `academySettings.<code>.label` / `.description` (plus
 * `.options.<value>` or `.unit`) in both en.ts and ar.ts.
 */
export const ACADEMY_SETTINGS = [
  // requestedBy: Reference academy — provisional pick by Mohamed (2026-09-24)
  // to ship the engine; no second academy has asked yet. Revisit after the
  // teacher calls: if academies don't differ, retire code 00001 (never reuse
  // it) and keep 60 as a plain constant.
  {
    code: "00001",
    group: "scheduling",
    control: { kind: "number", min: 30, max: 180, step: 15 },
    default: 60,
    // Only fills in new group time slots; existing groups keep their times.
    appliesTo: "future",
  },
] as const satisfies readonly AcademySettingDefinition[];

/** The starting length, in minutes, of a new group time slot. */
export const DEFAULT_CLASS_LENGTH_CODE = "00001";

/** Preference 00001's registry default, for forms to use before the academy's value loads. */
export const DEFAULT_CLASS_LENGTH_MINUTES: number =
  ACADEMY_SETTINGS.find((entry) => entry.code === DEFAULT_CLASS_LENGTH_CODE)
    ?.default ?? 60;

type RegisteredAcademySetting = (typeof ACADEMY_SETTINGS)[number];

export type AcademySettingCode = RegisteredAcademySetting["code"];

/** Every registered preference's effective value for one academy, defaults merged. */
export type AcademySettings = {
  [E in RegisteredAcademySetting as E["code"]]: AcademySettingControlValue<
    E["control"]
  >;
};
