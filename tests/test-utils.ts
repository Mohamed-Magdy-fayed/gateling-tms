/**
 * Shared helpers for schema tests.
 *
 * Not a `*.test.ts` file, so vitest's `include` doesn't try to collect it as a
 * suite.
 */

type ParseResultLike = {
  success: boolean;
  error?: { issues: readonly unknown[] };
};

/**
 * The translation key a failed parse reported for `path`, if any.
 *
 * Zod messages in this repo are translation keys rather than English strings
 * (see `translationKey()`), so asserting the key is what proves a field points
 * at the right message — not just that it was rejected.
 */
export function issueKeyAt(
  result: ParseResultLike,
  path: string,
): string | undefined {
  if (result.success || !result.error) return undefined;

  const issue = result.error.issues.find(
    (
      candidate,
    ): candidate is { path: (string | number)[]; message: string } => {
      const typed = candidate as { path?: (string | number)[] };
      return typed.path?.at(-1) === path;
    },
  );

  return issue?.message;
}
