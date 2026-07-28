import { describe, expect, test } from "vitest";
import ar from "@/features/core/i18n/global/ar";
import en from "@/features/core/i18n/global/en";

/**
 * `LanguageMessages` is an index-signature type, so a key present in `en.ts`
 * and missing from `ar.ts` type-checks cleanly and only surfaces as a raw key
 * rendered in the Arabic UI. README.md's rule 4 ("every user-visible string
 * exists in both dictionaries in the same change") therefore has nothing
 * enforcing it — this test is that enforcement.
 */

type Dictionary = { [key: string]: unknown };

function keyPaths(value: unknown, prefix = ""): string[] {
  // Leaves are plain strings and `dt()` results — the latter is a
  // [message, options] tuple, so it must be treated as a leaf rather than
  // walked into as if the indices were translation keys.
  if (value === null || typeof value !== "object") return [prefix];
  if (Array.isArray(value)) return [prefix];

  return Object.entries(value as Dictionary).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

/** The message text at `path`: the string itself, or a `dt()` tuple's first element. */
function messageAt(dictionary: Dictionary, path: string): unknown {
  const value = path
    .split(".")
    .reduce<unknown>((node, part) => (node as Dictionary)?.[part], dictionary);

  return Array.isArray(value) ? value[0] : value;
}

describe("translation dictionaries", () => {
  const enKeys = keyPaths(en).sort();
  const arKeys = keyPaths(ar).sort();

  // Guards the guard: if the walker ever stopped finding keys, every parity
  // assertion below would pass vacuously.
  test("walks the whole dictionary", () => {
    expect(enKeys.length).toBeGreaterThan(400);
    expect(enKeys).toContain("dashboard.stats.ofLimit");
    expect(enKeys).toContain("certificates.title");
  });

  test("every English key has an Arabic counterpart", () => {
    expect(enKeys.filter((key) => !arKeys.includes(key))).toEqual([]);
  });

  test("every Arabic key has an English counterpart", () => {
    expect(arKeys.filter((key) => !enKeys.includes(key))).toEqual([]);
  });

  test("no translation value is left empty", () => {
    const blanks = Object.entries({ en, ar }).flatMap(([locale, dictionary]) =>
      keyPaths(dictionary)
        .filter((key) => {
          const value = messageAt(dictionary, key);
          return typeof value === "string" && value.trim() === "";
        })
        .map((key) => `${locale}.${key}`),
    );

    expect(blanks).toEqual([]);
  });
});
