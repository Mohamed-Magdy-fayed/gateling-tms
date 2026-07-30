import type { ImportRowError } from "@/features/core/import/lib";

/**
 * How an imported row names something that already exists — a trainee, a
 * course, a group. Pure and database-free so the matching rules can be unit
 * tested on their own, the same way the per-entity resolution modules are.
 */

/** Trimmed and lowercased, so "Sara@X.com" and "sara@x.com" are one person. */
export function matchKey(value: string): string {
  return value.trim().toLowerCase();
}

/** `null` for a blank cell, which is never comparable to anything. */
export function optionalMatchKey(value: string): string | null {
  const key = matchKey(value);
  return key === "" ? null : key;
}

/**
 * The distinct names in a batch, keeping each one's first spelling — a file
 * that writes "Beginners A" then "beginners a" creates one group, named the
 * way the file first wrote it.
 */
export function distinctNames(names: string[]): string[] {
  const byKey = new Map<string, string>();

  for (const value of names) {
    const name = value.trim();
    if (name === "") continue;
    const key = matchKey(name);
    if (!byKey.has(key)) byKey.set(key, name);
  }

  return [...byKey.values()];
}

/**
 * The organization's trainees, indexed the two ways an enrollment or roster
 * row can name one. Names map to *every* matching trainee rather than one,
 * because a roster legitimately holds two people with the same name and an
 * import must refuse to guess between them.
 */
export type TraineeDirectory = {
  byEmail: Map<string, string>;
  idsByName: Map<string, string[]>;
};

export type TraineeLookup =
  | { traineeId: string }
  | { rejected: ImportRowError };

/**
 * Email wins when both columns are filled: it is the only one of the two that
 * identifies a person unambiguously.
 */
export function lookupTraineeId(
  email: string,
  name: string,
  directory: TraineeDirectory,
): TraineeLookup {
  const emailKey = optionalMatchKey(email);
  if (emailKey !== null) {
    const traineeId = directory.byEmail.get(emailKey);
    return traineeId
      ? { traineeId }
      : {
          rejected: {
            column: "traineeEmail",
            message: "import.validation.unknownTrainee",
          },
        };
  }

  const nameKey = optionalMatchKey(name);
  if (nameKey === null) {
    return {
      rejected: {
        column: "traineeName",
        message: "import.validation.traineeRequired",
      },
    };
  }

  const matches = directory.idsByName.get(nameKey) ?? [];
  if (matches.length === 0) {
    return {
      rejected: {
        column: "traineeName",
        message: "import.validation.unknownTrainee",
      },
    };
  }
  if (matches.length > 1) {
    return {
      rejected: {
        column: "traineeName",
        message: "import.validation.ambiguousTrainee",
      },
    };
  }

  return { traineeId: matches[0] };
}
